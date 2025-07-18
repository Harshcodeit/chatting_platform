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
    onAuthStateChanged,
    signOut,
}
from "firebase/auth"

//database
import{
    getDatabase,
    ref,
    set,
    serverTimestamp
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

    //add user to db
    const addUserToDb = async (user)=>{
        try{
            await set(ref(database,`users/${user.uid}`),{
                uid:user.uid,
                email:user.email,
                displayName:user.database || user.email.split('@')[0],
                createdAt:serverTimestamp(),
                lastLoginAt:serverTimestamp(),
            })
            console.log("User added to database succesfully")
        } catch(error){
            console.log("Error adding user to database:",error)
            throw error
        }
    }
    //sign in
    const signupUserWithEmailAndPassword= async(email,password)=>{
        try{
            const result=await createUserWithEmailAndPassword(firebaseAuth,email,password)
            await addUserToDb(result.user)
            return result
        } catch(error){
            console.log("Error signin up:",error)
            throw error
        }
    }

    //login via email
    const signinUserWithEmailAndPassword= async(email,password)=>{
        try{
            const result= await signInWithEmailAndPassword(firebaseAuth,email,password)

            //update last login time
            await set(ref(database,`users/${result.user.uid}/lastLoginAt`),serverTimestamp())
            return result
        } catch(error){
            console.log("Error signing in:",error)
            throw error
        }
    }

    //sign/login via google account
    const signinWithGoogle= async()=>{
        try{
            const result= await signInWithPopup(firebaseAuth,googleProvider)
            //check if user is new
            const isNewUser=result._tokenResponse?.isNewUser
            if(isNewUser){
                await addUserToDb(result.user)
            }
            else{
                //update last login time for existing user
                set(ref(database,`users/${result.user.uid}/lastLoginAt`),serverTimestamp())
            }
            return result
        } catch(error){
            console.error("Error signing in with Google:",error)
            throw error
        }
    }
    //log out function
    const logout=()=>{signOut(firebaseAuth)}

    const isLoggedIn = user? true : false
    
    return(
        <FirebaseContext.Provider 
        value={{ 
            signupUserWithEmailAndPassword,
            signinUserWithEmailAndPassword,
            signinWithGoogle,
            logout,
            isLoggedIn,
            user
            }}>
            {props.children}
        </FirebaseContext.Provider>
    )
}