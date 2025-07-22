# interest_matching.py
import firebase_admin
from firebase_admin import credentials, firestore
from sentence_transformers import SentenceTransformer, util
import numpy as np
from datetime import datetime, timedelta
import uuid
import json
from typing import List, Dict, Optional, Tuple

class InterestMatcher:
    def __init__(self, service_account_path: str):
        """Initialize the Interest Matcher with Firebase and ML model"""
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
        
        self.db = firestore.client()
        
        # Initialize sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Collection names
        self.USERS_COLLECTION = 'anonymous_users'
        self.MATCHES_COLLECTION = 'matches'
    
    def create_user_profile(self, interests: List[str], user_id: str = None) -> str:
        """Create a user profile with interests and return user_id"""
        if not user_id:
            user_id = str(uuid.uuid4())
        
        # Create interest embedding
        interests_text = " ".join(interests)
        embedding = self.model.encode(interests_text).tolist()
        
        user_data = {
            'user_id': user_id,
            'interests': interests,
            'interests_text': interests_text,
            'embedding': embedding,
            'created_at': datetime.now(),
            'status': 'looking_for_match',  # looking_for_match, matched, offline
            'last_active': datetime.now()
        }
        
        # Store in Firebase
        self.db.collection(self.USERS_COLLECTION).document(user_id).set(user_data)
        return user_id
    
    def find_best_match(self, user_id: str, similarity_threshold: float = 0.3) -> Optional[Dict]:
        """Find the best match for a user based on interest similarity"""
        try:
            # Get current user data
            user_doc = self.db.collection(self.USERS_COLLECTION).document(user_id).get()
            if not user_doc.exists:
                return None
            
            user_data = user_doc.to_dict()
            user_embedding = np.array(user_data['embedding'])
            
            # Get all available users (looking for match and active in last 30 minutes)
            cutoff_time = datetime.now() - timedelta(minutes=30)
            
            available_users = self.db.collection(self.USERS_COLLECTION)\
                .where('status', '==', 'looking_for_match')\
                .where('last_active', '>=', cutoff_time)\
                .stream()
            
            best_match = None
            best_similarity = similarity_threshold
            
            for doc in available_users:
                candidate_data = doc.to_dict()
                candidate_id = candidate_data['user_id']
                
                # Skip self
                if candidate_id == user_id:
                    continue
                
                # Calculate cosine similarity
                candidate_embedding = np.array(candidate_data['embedding'])
                similarity = util.cos_sim(user_embedding, candidate_embedding).item()
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = {
                        'match_user_id': candidate_id,
                        'similarity_score': similarity,
                        'common_interests': self._find_common_interests(
                            user_data['interests'], 
                            candidate_data['interests']
                        ),
                        'match_data': candidate_data
                    }
            
            return best_match
            
        except Exception as e:
            print(f"Error finding match: {e}")
            return None
    
    def _find_common_interests(self, interests1: List[str], interests2: List[str]) -> List[str]:
        """Find common interests between two users"""
        # Direct matches
        common = list(set(interests1) & set(interests2))
        
        # If not many direct matches, find semantic similarities
        if len(common) < 2:
            interest1_embeddings = self.model.encode(interests1)
            interest2_embeddings = self.model.encode(interests2)
            
            # Find semantically similar interests
            similarities = util.cos_sim(interest1_embeddings, interest2_embeddings)
            
            for i, interest1 in enumerate(interests1):
                for j, interest2 in enumerate(interests2):
                    if similarities[i][j] > 0.6 and interest1 != interest2:
                        if f"{interest1} ~ {interest2}" not in common:
                            common.append(f"{interest1} ~ {interest2}")
        
        return common[:5]  # Return max 5 common interests
    
    def create_match(self, user1_id: str, user2_id: str, similarity_score: float, 
                    common_interests: List[str]) -> str:
        """Create a match between two users"""
        match_id = str(uuid.uuid4())
        
        match_data = {
            'match_id': match_id,
            'user1_id': user1_id,
            'user2_id': user2_id,
            'similarity_score': similarity_score,
            'common_interests': common_interests,
            'created_at': datetime.now(),
            'status': 'active',  # active, ended
            'messages': []
        }
        
        # Store match
        self.db.collection(self.MATCHES_COLLECTION).document(match_id).set(match_data)
        
        # Update user statuses
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
        
        return match_id
    
    def process_matching_request(self, interests: List[str]) -> Dict:
        """Process a complete matching request - create user and find match"""
        try:
            # Create user profile
            user_id = self.create_user_profile(interests)
            
            # Try to find a match immediately
            match_result = self.find_best_match(user_id)
            
            if match_result:
                # Create the match
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
                return {
                    'status': 'waiting_for_match',
                    'user_id': user_id,
                    'message': 'Looking for someone with similar interests...'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error processing request: {str(e)}'
            }
    
    def end_match(self, match_id: str) -> bool:
        """End a match and reset user statuses"""
        try:
            # Get match data
            match_doc = self.db.collection(self.MATCHES_COLLECTION).document(match_id).get()
            if not match_doc.exists:
                return False
            
            match_data = match_doc.to_dict()
            
            # Update match status
            self.db.collection(self.MATCHES_COLLECTION).document(match_id).update({
                'status': 'ended',
                'ended_at': datetime.now()
            })
            
            # Reset user statuses
            for user_id in [match_data['user1_id'], match_data['user2_id']]:
                self.db.collection(self.USERS_COLLECTION).document(user_id).update({
                    'status': 'offline',
                    'current_match_id': None,
                    'last_active': datetime.now()
                })
            
            return True
            
        except Exception as e:
            print(f"Error ending match: {e}")
            return False
    
    def get_waiting_users_count(self) -> int:
        """Get count of users currently waiting for a match"""
        try:
            cutoff_time = datetime.now() - timedelta(minutes=30)
            
            waiting_users = self.db.collection(self.USERS_COLLECTION)\
                .where('status', '==', 'looking_for_match')\
                .where('last_active', '>=', cutoff_time)\
                .stream()
            
            return len(list(waiting_users))
            
        except Exception as e:
            print(f"Error getting waiting users count: {e}")
            return 0
    
    def cleanup_inactive_users(self):
        """Clean up users who have been inactive for more than 1 hour"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=1)
            
            inactive_users = self.db.collection(self.USERS_COLLECTION)\
                .where('last_active', '<', cutoff_time)\
                .stream()
            
            for doc in inactive_users:
                doc.reference.update({'status': 'offline'})
                
        except Exception as e:
            print(f"Error cleaning up inactive users: {e}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize matcher
    matcher = InterestMatcher('serviceAccountKey.json')
    
    # Test the system
    print("Testing Interest Matching System...")
    
    # Test interests
    user1_interests = ['Technology', 'Programming', 'AI', 'Gaming', 'Music']
    user2_interests = ['Tech', 'Coding', 'Machine Learning', 'Video Games', 'Rock Music']
    user3_interests = ['Cooking', 'Travel', 'Photography', 'Art', 'Dancing']
    
    # Process matching requests
    print("\nProcessing matching requests...")
    
    result1 = matcher.process_matching_request(user1_interests)
    print(f"User 1 result: {result1}")
    
    result2 = matcher.process_matching_request(user2_interests)  
    print(f"User 2 result: {result2}")
    
    result3 = matcher.process_matching_request(user3_interests)
    print(f"User 3 result: {result3}")
    
    # Check waiting users
    waiting_count = matcher.get_waiting_users_count()
    print(f"\nUsers currently waiting: {waiting_count}")
    
    # Cleanup
    matcher.cleanup_inactive_users()
    print("Cleanup completed!")