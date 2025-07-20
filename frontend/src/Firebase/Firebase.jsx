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
    push,
    onValue,
    off,
    serverTimestamp,
    orderByChild,
    query,
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
                isOnline:true,
            })
            console.log("User added to database succesfully")
        } catch(error){
            console.log("Error adding user to database:",error)
            throw error
        }
    }
    //sign up
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

            //update last login time & online status
            await set(ref(database,`users/${result.user.uid}/lastLoginAt`),serverTimestamp())
            await set(ref(database,`users/${result.user.uid}/isOnline`),true)
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
                await set(ref(database,`users/${result.user.uid}/lastLoginAt`),serverTimestamp())
                await set(ref(database,`users/${result.user.uid}/isOnline`),true)
            }
            return result
        } catch(error){
            console.error("Error signing in with Google:",error)
            throw error
        }
    }

    //log out function
    const logout=async()=>{
        try{
            if (user){
                await set(ref(database,`users/${user.uid}/isOnline`),false)
            }
            await signOut(firebaseAuth)
        } catch(error){
            console.error("Error loggin out:",error)
            throw error
        }
    }

    //chat functions
    const sendMessage= async(chatId,messageText,receiverId=null)=>{
        if(!user || !messageText.trim()) return
        try{
            const messageData={
                senderId:user.uid,
                senderName:user.displayName || user.email.split('@')[0],
                senderEmail:user.email,
                message:messageText.trim(),
                timeStamp:serverTimestamp(),
                chatId:chatId,
                receiverId:receiverId
            }
            //adding messages to messages collection
            const messageRef=push(ref(database,'messages')) //push add unique ,independent record
            await set(messageRef,messageData)

            //updating chat metadata
            const chatData={
                lastMessage:messageText.trim(),
                lastMessageTime:serverTimestamp(),
                lastMessageSender:user.uid,
                participants:receiverId ? [user.uid,receiverId] : [user.uid]
            }
            await set(ref(database,`chats/${chatId}`),chatData)
        } catch(error){
            console.error("Error sending message:",error)
            throw error
        }
    }
    
    //listen to messages for specific chat
    const listenToMessages = (chatId,callback)=>{
        if(!chatId) return ()=>{}

        const messageRef=query(
            ref(database,'messages'),
            orderByChild('chatId')
        )

        const unsubscribe= onValue(messageRef,(snapshot)=>{
            if(snapshot.exists()){
                const messagesData=snapshot.val()
                const messagesList=Object.keys(messagesData)
                    .map(key=>({
                        id:key,
                        ...messagesData[key]
                    }))
                    .filter(msg=>msg.chatId===chatId)
                    .sort((a,b)=>{
                        const timeA=a.timeStamp || 0
                        const timeB=b.timeStamp || 0
                        return timeA-timeB //oldest to newest
                    })
                callback(messagesList)
            } else{
                callback([])
            }
        })
        return ()=>off(messageRef,'value',unsubscribe)
    }

    //get all users(for chat contacts)
    const listenToUsers=(callback)=>{
        const usersRef=ref(database,'users')

        const unsubscribe=onValue(usersRef,(snapshot)=>{
            if(snapshot.exists()){
                const usersData=snapshot.val()
                const usersList=Object.keys(usersData)
                    .map(key=>({
                        id:key,
                        ...usersData[key]
                    }))
                    .filter(userData=>userData.uid!==user?.uid)//exclued current user

                callback(usersList)
            }
            else callback([])
        })
        return ()=>off(usersRef,'value',unsubscribe)
    }

    //generate chat id for two users
    const generateChatId=(userId1,userId2)=>{
        return [userId1,userId2].sort().join('_')
    }

    //listen to chats
    const listenToChats=(callback)=>{
        if(!user) return ()=>{}
        const chatsRef=ref(database,'chats')

        const unsubscribe=onValue(chatsRef,(snapshot)=>{
            if(snapshot.exists()){
                const chatsData=snapshot.val()
                const chatsList=Object.keys(chatsData)
                    .map(key=>({
                        id:key,
                        ...chatsData[key]
                    }))
                    .filter(chat=>
                        chat.participants &&
                        chat.participants.includes(user.uid)
                    )
                    .sort((a,b)=>{
                        const timeA=a.lastMessageTime || 0
                        const timeB=b.lastMessageTime || 0
                        return timeB-timeA //most recent first
                    })
                callback(chatsList)
            }
            else callback([])
        })
        return ()=>off(chatsRef,'value',unsubscribe)
    }

    const isLoggedIn = user? true : false
    
    return(
        <FirebaseContext.Provider 
        value={{ 
            signupUserWithEmailAndPassword,
            signinUserWithEmailAndPassword,
            signinWithGoogle,
            logout,
            isLoggedIn,
            user,
            //chat functions
            sendMessage,
            listenToMessages,
            listenToChats,
            listenToUsers,
            generateChatId,
            }}>
            {props.children}
        </FirebaseContext.Provider>
    )
}