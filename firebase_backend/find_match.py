import firebase_admin
from firebase_admin import credentials, firestore
from sentence_transformers import SentenceTransformer, util
import numpy as np
from datetime import datetime, timedelta
import uuid
from typing import List, Optional, Dict

class InterestMatcher:
    def __init__(self, service_account_path: str):
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()

        # Initialize model
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print(f"DEBUG: SentenceTransformer model loaded successfully!")
        except Exception as e:
            self.model=None #if failed
            print(f"ERROR:Failed to load sentencetransformer model:{e}")

        # Collections
        self.USERS_COLLECTION = 'anonymous_users'
        self.MATCHES_COLLECTION = 'matches'

        # In-memory queue: user_id -> (embedding, interests, last_active)
        self.waiting_queue: Dict[str, Dict] = {}

        # Similarity threshold for matching
        self.similarity_threshold = 0.5

    def get_embedding(self, interests: List[str]) -> np.ndarray:
        if self.model is None:
            print("ERROR_EMBEDDING: SentenceTransformer model is None. Cannot generate embedding.")
            return None # Explicitly return None if model isn't loaded

        interests_text = " ".join(sorted(interests))
        try:
            embedding= self.model.encode(interests_text)
            print(f"DEBUG: Interests '{interests_text}' encoded to embedding shape:{embedding.shape}")
            return embedding

        except Exception as e:
            print(f"ERROR_EMBEDDING : failed to encode interests '{interests_text}:{e}")
            return None

    def create_user_profile(self, interests: List[str], user_id: Optional[str] = None) -> str:
        if not user_id:
            user_id = str(uuid.uuid4())
        print(f"DEBUG:Attemptiog to create/update user profile for user id {user_id} with interests {interests}")
        embedding_np_array = self.get_embedding(interests)

        if embedding_np_array is None:
            print(f"ERROR_PROFILE: get_embedding returned None for user {user_id} with interests {interests}.Cannot create profile")
            raise ValueError("Failed to generate embedding for user interests")

        embedding=embedding_np_array.tolist()

        user_data = {
            'user_id': user_id,
            'interests': interests,
            'interests_text': " ".join(interests),
            'embedding': embedding,
            'created_at': datetime.now(),
            'status': 'looking_for_match',
            'last_active': datetime.now()
        }
        try:
            self.db.collection(self.USERS_COLLECTION).document(user_id).set(user_data)
            print(f"DEBUG Successfully wrote user {user_id} to Firestore")
        except Exception as e:
            print(f"ERROR: Failed to write user {user_id} to Firestore : {e}")

        # Add to in-memory queue as well
        self.waiting_queue[user_id] = {
            'embedding': np.array(embedding),
            'interests': interests,
            'last_active': datetime.now()
        }
        print(f"DEBUG:User {user_id} added to in-m/y queue.CUrrent queue size: {len(self.waiting_queue)}")
        return user_id

    def find_match_from_queue(self, user_id: str, user_embedding: np.ndarray) -> Optional[Dict]:
        best_match = None
        best_similarity = self.similarity_threshold

        for candidate_id, data in list(self.waiting_queue.items()):
            if candidate_id == user_id:
                continue
            candidate_embedding = data['embedding']
            similarity = util.cos_sim(user_embedding, candidate_embedding).item()
            print(f"DEBUG : Comparing user {user_id} with candidate {candidate_id}.Similairty :{similarity:.4f}")
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = {
                    'match_user_id': candidate_id,
                    'similarity_score': similarity,
                    'common_interests': self._find_common_interests(
                        self.waiting_queue[user_id]['interests'],
                        data['interests']
                    )
                }
        return best_match

    def _find_common_interests(self, interests1: List[str], interests2: List[str]) -> List[str]:
        common = list(set(interests1) & set(interests2))
        if len(common) < 2:
            interest1_embeddings = self.model.encode(interests1)
            interest2_embeddings = self.model.encode(interests2)
            similarities = util.cos_sim(interest1_embeddings, interest2_embeddings)
            for i, interest1 in enumerate(interests1):
                for j, interest2 in enumerate(interests2):
                    if similarities[i][j] > 0.6 and interest1 != interest2:
                        if f"{interest1} ~ {interest2}" not in common:
                            common.append(f"{interest1} ~ {interest2}")
        return common[:5]

    def create_match(self, user1_id: str, user2_id: str, similarity_score: float,
                     common_interests: List[str]) -> str:
        match_id = str(uuid.uuid4())
        match_data = {
            'match_id': match_id,
            'user1_id': user1_id,
            'user2_id': user2_id,
            'similarity_score': similarity_score,
            'common_interests': common_interests,
            'created_at': datetime.now(),
            'status': 'active',
            'messages': []
        }
        self.db.collection(self.MATCHES_COLLECTION).document(match_id).set(match_data)

        self.db.collection(self.USERS_COLLECTION).document(user1_id).update({
            'status': 'matched',
            'current_match_id': match_id,
            'last_active': datetime.now()
        })
        self.db.collection(self.USERS_COLLECTION).document(user2_id).update({
            'status': 'matched',
            'current_match_id': match_id,
            'last_active': datetime.now()
        })

        # Remove from queue
        self.waiting_queue.pop(user1_id, None)
        self.waiting_queue.pop(user2_id, None)

        return match_id

    def process_matching_request(self, interests: List[str], user_id: Optional[str] = None) -> Dict:
        print(f"DEBUG: Process_matching_request called for user_id:{user_id},interests:{interests}")
        try:
            # If user exists, update last_active & status
            if user_id and user_id in self.waiting_queue:
                print(f"DEBUG:User {user_id} found in queue, updating last_active")
                self.waiting_queue[user_id]['last_active'] = datetime.now()
                self.db.collection(self.USERS_COLLECTION).document(user_id).update({
                    'last_active': datetime.now(),
                    'status': 'looking_for_match'
                })
                current_user_embedding=self.waiting_queue[user_id]['embedding']
                if current_user_embedding is None:
                    print(f"ERROR_PROCESS:User {user_id} in queue has None embedding")
                    raise ValueError("Queue user has null embedding")
            else:
                # Create new user profile
                print(f"DEBUG:User {user_id} not in queue or new user , calling create_user_profile")
                user_id = self.create_user_profile(interests, user_id)

                current_user_embedding = self.waiting_queue[user_id]['embedding'] # Get embedding from queue after creation
                if current_user_embedding is None:
                    print(f"ERROR_PROCESS: After create_user_profile, user {user_id} in queue has a None embedding!")
                    raise ValueError("Newly created user has null embedding.")

            user_embedding = current_user_embedding

            # Try to find a match in the queue
            match_result = self.find_match_from_queue(user_id, user_embedding)

            if match_result:
                match_id = self.create_match(
                    user_id,
                    match_result['match_user_id'],
                    match_result['similarity_score'],
                    match_result['common_interests']
                )
                return {
                    'status': 'match_found',
                    'user_id': user_id,
                    'match_id': match_id,
                    'similarity_score': match_result['similarity_score'],
                    'common_interests': match_result['common_interests']
                }
            else:
                # No match, keep waiting
                return {
                    'status': 'waiting_for_match',
                    'user_id': user_id,
                    'message': 'Looking for someone with similar interests...'
                }

        except Exception as e:
            print(f"ERROR:in process_matching_request : {e}")
            return {
                'status': 'error',
                'message': f'Error processing request: {str(e)}'
            }

    def end_match(self, match_id: str) -> bool:
        try:
            match_doc = self.db.collection(self.MATCHES_COLLECTION).document(match_id).get()
            if not match_doc.exists:
                return False
            match_data = match_doc.to_dict()

            self.db.collection(self.MATCHES_COLLECTION).document(match_id).update({
                'status': 'ended',
                'ended_at': datetime.now()
            })

            for user_id in [match_data['user1_id'], match_data['user2_id']]:
                self.db.collection(self.USERS_COLLECTION).document(user_id).update({
                    'status': 'offline',
                    'current_match_id': None,
                    'last_active': datetime.now()
                })
                # Also remove from queue if present (just in case)
                self.waiting_queue.pop(user_id, None)

            return True
        except Exception as e:
            print(f"Error ending match: {e}")
            return False

    def get_waiting_users_count(self) -> int:
        # Return length of queue (fast)
        return len(self.waiting_queue)

    def cleanup_inactive_users(self):
        cutoff_time = datetime.now() - timedelta(hours=1)
        inactive_users = []
        # Find inactive users in queue
        for user_id, data in list(self.waiting_queue.items()):
            if data['last_active'] < cutoff_time:
                inactive_users.append(user_id)
                del self.waiting_queue[user_id]

        # Update Firestore for inactive users
        for user_id in inactive_users:
            try:
                self.db.collection(self.USERS_COLLECTION).document(user_id).update({'status': 'offline'})
            except Exception as e:
                print(f"Error cleaning up inactive user {user_id}: {e}")
