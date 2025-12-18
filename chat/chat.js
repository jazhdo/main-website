// Version 12/16/2025

// Firebase stuff
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, query, orderBy, doc, getDoc, setDoc, updateDoc, arrayUnion, increment, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase references
// https://firebase.google.com/docs/reference/js/app.md
// https://firebase.google.com/docs/reference/js/firestore_.md
// https://firebase.google.com/docs/reference/js/auth.md

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHm5_zvReOaA6RpttJ1KlIhoONis99MKA",
    authDomain: "jazhdo-backend.firebaseapp.com",
    projectId: "jazhdo-backend",
    storageBucket: "jazhdo-backend.firebasestorage.app",
    messagingSenderId: "535780894340",
    appId: "1:535780894340:web:ca78bc82bbe1ff0a8204d1"
};

// Variables
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messageCollection = collection(db, 'chat');
let chatId = '';

// Functions
async function sendMessage(messageData) {
    // metaRef is main data doc, metaSnap is a snapshot of that main data doc
    const metaRef = doc(db, "chats", chatId);
    const metaSnap = await getDoc(metaRef);
    
    let currentBucket = 1;
    let messageCount = 0;

    if (metaSnap.exists()) {
        currentBucket = metaSnap.data().currentBucket || 1;
        messageCount = metaSnap.data().totalMessages || 0;
    };

    // Add another bucket or just get current bucket (bucketRef is the current bucket that is being added to)
    const bucketSize = 250;
    const targetBucket = Math.floor(messageCount / bucketSize) + 1;
    const bucketRef = doc(db, "chats", `${chatId}_${targetBucket}`);

    // Add info to bucket doc
    await setDoc(bucketRef, {
        messages: arrayUnion({
        ...messageData,
        timestamp: new Date().toISOString()
        })
    }, { merge: true }); // This is to add the bucket doc (doc_1, doc_2, doc_3, etc. for the same chat) in case it has not yet been created

    // Add info to main data doc
    await setDoc(metaRef, {
        totalMessages: increment(1),
        currentBucket: targetBucket,
        lastMessage: messageData.text,
        updatedAt: new Date()
    }, { merge: true });
};
async function addUser(userUID) {
    const metaRef = doc(db, "chats", chatId);
    await setDoc(metaRef, {
        participants: arrayUnion(userUID),
        updatedAt: new Date()
    }, { merge: true });
};
async function removeUser(userUID) {
    const metaRef = doc(db, "chats", chatId);
    await setDoc(metaRef, {
        participants: arrayRemove(userUID),
        updatedAt: new Date()
    }, { merge: true });
}
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("Please login to access the chat service. This is implemented for safety reasons.")
        window.location.href = '/login.html?redirect=/chat/';
    }
    document.getElementById("typeForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const message = document.getElementById("typeInput").value.trim();

        alert(`Your message containing the contents ${message} has been sent to nowhere.`);
    });
});