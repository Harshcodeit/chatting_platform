import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { createContext, useContext } from "react";
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCWR1RVa2UnTVSFIXJdHB7esCevFuXj628",
  authDomain: "chatzone-d3d69.firebaseapp.com",
  projectId: "chatzone-d3d69",
  storageBucket: "chatzone-d3d69.firebasestorage.app",
  messagingSenderId: "160350740414",
  appId: "1:160350740414:web:7836b971229daf7ea5a3ef",
  measurementId: "G-1LKCM63KDY"
};

const app=initializeApp(firebaseConfig)
const analytics=getAnalytics(app)

const firebaseAuth=getAuth(app)
const database=getDatabase(app)

const FirebaseContext=createContext(null)
export const useFirebase=()=>useContext(FirebaseContext)

export const FirebaseContextProvider=(props)=>{
    return(
        <FirebaseContext.Provider>
            {props.children}
        </FirebaseContext.Provider>
    )
}
