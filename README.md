# chatting_platform
An interest-based chat platform offering both anonymous and direct messaging using machine learning (sentence embeddings). Built with React.js frontend and Firebase backend

## Tech Stack

## Frontend (React)
- Framework: React.js
- UI: React-bootstrap
- Routing: React Router DOM
- State Management: React Context API
- Real-time Messaging: Firebase SDK
- Authentication: Firebase Authentication (Anonymous sign-in or Google login)

## Backend (Firebase)
- Auth: Firebase Authentication
- Database: Firestore(NoSQL)
- Real-time Messaging: Firestore real-time listeners
- Hosting: Firebase Hosting (optional)


## Machine Learning (Matching Logic)
- ML Pipeline: Sentence embeddings of user interests
- Model: all-MiniLM-L6-v2 (sentence-transformers)
- Where: Firebase Local Python Script
- Similarity: Cosine Similarity (Scikit-learn)


# Directory Structure Proposal
```
chatting_platform/
├── firebase_backend/
│   ├── serviceAccountKey.json
│   ├── requirements.txt
│   ├── upload_user.py
│   ├── find_match.py
│   └── app.py           # Flask API (optional)
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js       # Main UI
│       ├── MatchResult.js  # (optional) show match result
│       └── api.js       # Axios or fetch calls to Flask API
│   └── package.json
└── README.md
```
