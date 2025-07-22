from flask import Flask, request, jsonify
from find_match import InterestMatcher  

matcher = InterestMatcher('serviceAccountKey.json')

app = Flask(__name__)

@app.route('/process_match', methods=['POST'])
def process_match():
    data = request.json
    interests = data.get('interests')
    if not interests:
        return jsonify({'status': 'error', 'message': 'Interests required'}), 400
    
    result = matcher.process_matching_request(interests)
    return jsonify(result)

@app.route('/end_match', methods=['POST'])
def end_match():
    data = request.json
    match_id = data.get('match_id')
    if not match_id:
        return jsonify({'status': 'error', 'message': 'Match ID required'}), 400
    
    success = matcher.end_match(match_id)
    return jsonify({'status': 'success' if success else 'failed'})

@app.route('/waiting_users', methods=['GET'])
def waiting_users():
    count = matcher.get_waiting_users_count()
    return jsonify({'waiting_users_count': count})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
