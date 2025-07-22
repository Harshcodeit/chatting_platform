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
    updateProfile,
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
    equalTo,
    get,
    remove,
    update,
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
    
    //check if username already exists
    const checkUserNameExists=async(username)=>{
        try{
            const usernameRef=query(
                ref(database,'usernames'),
                orderByChild('username'),
                equalTo(username.toLowerCase())
            )
            const snapshot=await get(usernameRef)
            return snapshot.exists()
        }
        catch(error){
            console.error("Error checking username:",error)
            throw error
        }
    }

    //find user by username
    const findUserByUsername=async(username)=>{
        try{
            const usernameRef=query(
                ref(database,'usernames'),
                orderByChild('username'),
                equalTo(username.toLowerCase())
            )
            const snapshot=await get(usernameRef)
            if(snapshot.exists()){
                const data=snapshot.val()
                const userId=Object.keys(data)[0]
                return data[userId].email
            }
        }
        catch(error){
            console.error("Error finding user by username:",error)
            throw error
        }
    }

    //add user to db
    const addUserToDb = async (user,username=null)=>{
        try{
            const displayName=username || user.displayName || user.email.split('@')[0]

            //update firebase auth profile
            await updateProfile(user,{
                displayName:displayName
            })
            await set(ref(database,`users/${user.uid}`),{
                uid:user.uid,
                email:user.email,
                displayName:displayName,
                username:username?username.toLowerCase():null,
                createdAt:serverTimestamp(),
                lastLoginAt:serverTimestamp(),
                isOnline:true,
            })
            if(username){
                await set(ref(database,`usernames/${user.uid}`),{
                    username:username.toLowerCase(),
                    email:user.email,
                    uid:user.uid,
                })
            }
            console.log("User added to database succesfully")
        } catch(error){
            console.log("Error adding user to database:",error)
            throw error
        }
    }
    //sign up with username,email and password
    const signupUserWithEmailAndPassword= async(email,password,username)=>{
        try{
            //if username exists already
            if(username){
                const usernameExists=await checkUserNameExists(username)
                if(usernameExists){
                    throw new Error("Username already exists.Please choose a different username")
                }
            }
            const result=await createUserWithEmailAndPassword(firebaseAuth,email,password)
            await addUserToDb(result.user,username)
            return result
        } catch(error){
            console.log("Error signin up:",error)
            throw error
        }
    }

    //helper function to check if user exists in db
    const checkUserExistsInDb=async(uid)=>{
        try{
            const snapshot=await get(ref(database,`users${uid}`))
            return snapshot.exists() && snapshot.val().email
        }
        catch(error){
            console.error("Error checking user exists:",error)
            return false
        }
    }

    //login via email/username and password
    const signinUserWithEmailAndPassword= async(emailOrUsername,password)=>{
        try{
            let email=emailOrUsername

            //check if its a username(doesnt contain @)
            if(!emailOrUsername.includes('@')){ //if it doesnt contain @
                const foundEmail=await findUserByUsername(emailOrUsername)
                if(!foundEmail){
                    throw new Error("Username not found")
                }
                email=foundEmail
            }
            const result= await signInWithEmailAndPassword(firebaseAuth,email,password)

            const userExists=checkUserExistsInDb(result.user.uid)
            if(!userExists){
                    console.log("User not found in database creating user record...")
                    await addUserToDb(result.user)
            }
            else{
                await update(ref(database,`users/${result.user.uid}`),{
                    lastLoginAt:serverTimestamp(),
                    isOnline:true
                })
            }
            return result
        } 
        catch(error){
            console.log("Error signing in:",error)
            throw error
        }
    }

    //sign/login via google account
    const signinWithGoogle= async()=>{
        try{
            const result= await signInWithPopup(firebaseAuth,googleProvider)
            //check if user is new
            const userExists=await checkUserExistsInDb(result.user.uid)
            if(!userExists){
                console.log("New user or incomplete record,creating user...")
                await addUserToDb(result.user)
            }
            else{
                await update(ref(database,`users/${result.user.uid}`),{
                    lastLoginAt:serverTimestamp(),
                    isOnline:true
                })
            }
            return result
        } 
        catch(error){
            console.error("Error signing in with Google:",error)
            throw error
        }
    }

    //log out function
    const logout=async()=>{
        try{
            if(user){
                await update(ref(database,`users/${user.uid}`),{
                    isOnline:false
                })
            }
            await signOut(firebaseAuth)
        } 
        catch(error){
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
                isDeleted:false,
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
    
    //hard delete chats
    const deleteChat=async(chatId)=>{
        try{
            await remove(ref(database,`chats/${chatId}`))
            console.log("Chat deleted!")

            //deleted messages of this chat(optional)
            const messageRef=query(
                ref(database,'messages'),
                orderByChild('chatId'),
                equalTo(chatId)
            )
            const snapshot=await get(messageRef)
            if(snapshot.exists()){
                const messageData=snapshot.val()
                const updates={}

                //use root ref and correct paths
                Object.keys(messageData).forEach((messageId)=>{
                    updates[`messages/${messageId}`]=null
                })
                //use root database
                await update(ref(database),updates)
            }
            console.log("Chat and messages deleted succesfully")
        }
        catch(error){
            console.error("Failed to delete chat:",error)
            throw error
        }
    }

    //soft delete message-(delete for me)
    const deleteMessage=async(messageId)=>{
        try{
            await update(ref(database,`messages/${messageId}`),{
                isDeleted:true,
                message:"This message was deleted"
            })
            console.log("This message was deleted")
        }
        catch(error){
            console.error("Failed to delete message:",error)
        }
    }

    //anony-chat features
    const sendAnonymousMessage=async (matchId,messageText)=>{
        if(!messageText.trim()) return
        try{
            const messageData={
                message:messageText.trim(),
                chatId:matchId,
                timeStamp:serverTimestamp(),
                isDeleted:false,
                isAnonymous:true,
            }
            const messageRef=push(ref(database,'anonymous_messages'))
            await set(messageRef,messageData)
        }
        catch(error){
            console.error("Error sending anonymous message.",error)
            throw error
        }
    }

    const listenToAnonymousMessages = (matchId, callback) => {
    if (!matchId) return () => {};

    const msgQuery = query(ref(database, 'anonymous_messages'), orderByChild('chatId'));
    const unsubscribe = onValue(msgQuery, (snapshot) => {
        if (snapshot.exists()) {
            const messages = Object.entries(snapshot.val())
                .map(([id, msg]) => ({ id, ...msg }))
                .filter(msg => msg.chatId === matchId)
                .sort((a, b) => {
                    const tA = a.timeStamp || 0;
                    const tB = b.timeStamp || 0;
                    return tA - tB;
                });
            callback(messages);
        } 
        else {
            callback([]);
        }
    });
        return () => off(msgQuery, 'value', unsubscribe);
    };

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

            //username functions
            checkUserNameExists,
            findUserByUsername,

            //delete functions
            deleteChat,
            deleteMessage,

            //anonymous chat function
            sendAnonymousMessage,
            listenToAnonymousMessages,
            }}>
            {props.children}
        </FirebaseContext.Provider>
    )
}