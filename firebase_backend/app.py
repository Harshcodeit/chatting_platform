from flask import Flask, request, jsonify
from flask_cors import CORS
from find_match import InterestMatcher  

matcher = InterestMatcher('serviceAccountKey.json')

app = Flask(__name__)
CORS(app) #Initialized cors for app

@app.route('/process_match', methods=['POST'])
def process_match():
    print(f"DEBUG:process_match endpoint hit!")
    data = request.json
    print(f"DEBUG:Received data :{data}")
    interests = data.get('interests')
    user_id=data.get('user_id')
    print(f"DEBUG: Interests extracted: {interests}, User ID extracted: {user_id}")
    
    if not interests:
        print(f"DEBUG:Interests were missing!")
        return jsonify({'status': 'error', 'message': 'Interests required'}), 400
    
    result = matcher.process_matching_request(interests,user_id=user_id)
    return jsonify(result)

@app.route('/end_match', methods=['POST'])
def end_match():
    print(f"DEBUG:end_match endpoint hit!")
    data = request.json
    match_id = data.get('match_id')
    if not match_id:
        return jsonify({'status': 'error', 'message': 'Match ID required'}), 400
    
    success = matcher.end_match(match_id)
    return jsonify({'status': 'success' if success else 'failed'})

@app.route('/waiting_users', methods=['GET'])
def waiting_users():
    print("DEBUG:waiting_users endpoint hit!")
    count = matcher.get_waiting_users_count()
    return jsonify({'waiting_users_count': count})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
