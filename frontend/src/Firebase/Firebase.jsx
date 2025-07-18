import React, { useEffect, useState } from "react";

//firebase
import { initializeApp } from "firebase/app";
import { createContext, useContext } from "react";

//authentication
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
}
from "firebase/auth"

//database
import{
    getDatabase
}
from "firebase/database"

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig)
const firebaseAuth = getAuth(firebaseApp)
const googleProvider=new GoogleAuthProvider()

const database = getDatabase(firebaseApp)


const FirebaseContext = createContext(null)
export const useFirebase = () => useContext(FirebaseContext)

export const FirebaseContextProvider = (props) => {
    const [user,setUser]=useState(null)

    useEffect(()=>{
        onAuthStateChanged(firebaseAuth,(user)=>{
            if(user) setUser(user)
                else setUser(null)
        })
    },[])

    //sign in
    const signupUserWithEmailAndPassword=(email,password)=>{
        createUserWithEmailAndPassword(firebaseAuth,email,password)
    }

    //login via email
    const signinUserWithEmailAndPassword=(email,password)=>{
        signInWithEmailAndPassword(firebaseAuth,email,password)
    }

    //login via google account
    const signinWithGoogle=()=>{
        signInWithPopup(firebaseConfig,googleProvider)
    }

    const isLoggedIn = user? true : false
    
    return(
        <FirebaseContext.Provider 
        value={{ 
            signupUserWithEmailAndPassword,
            signinUserWithEmailAndPassword,
            signinWithGoogle
            }}>
            {props.children}
        </FirebaseContext.Provider>
    )
}