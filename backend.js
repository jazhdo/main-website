// Version 12/14/2025

// Firebase stuff
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHm5_zvReOaA6RpttJ1KlIhoONis99MKA",
    authDomain: "jazhdo-backend.firebaseapp.com",
    projectId: "jazhdo-backend",
    storageBucket: "jazhdo-backend.firebasestorage.app",
    messagingSenderId: "535780894340",
    appId: "1:535780894340:web:ca78bc82bbe1ff0a8204d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check if the form is submitted
if (document.getElementById("contactForm") !== null) {
    document.getElementById("contactForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get trimmed values
        const email = document.getElementById("contactEmail").value.trim();
        const message = document.getElementById("contactMessage").value.trim();
        const sentDate = new Date()

        // Prevent blank submissions
        if (!email || !message) {
            window.showAlert("Please fill in both the email and message fields before submitting.");
            return; // Stop the submission
        }
        try {
            const record = await addDoc(collection(db, "messages"), {
                email: email,
                message: message,
                createdAt: sentDate
            });
            window.showAlert("Thank you! Your message was successfully sent. Here's your ID for future inquiries: " + record.id);
            document.getElementById("contactForm").reset();
        } catch (error) {
            console.error("Error saving message:", error);
            window.showAlert("Oops! Something went wrong.");
        }
    });
}
function timestampToDate(ts) {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate(); // normal SDK case
    if (ts.seconds) {
        return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1_000_000);
    }
    return null;
}
async function loadContacts() {
    const snapshot = await getDocs(query(collection(db, "messages"), orderBy("createdAt", "desc")));
    snapshot.forEach(doc => {
        const box = document.createElement("div");
        const id = document.createElement("h2");
        const time = document.createElement("p");
        const email = document.createElement("p");
        const message = document.createElement("p");

        const createdDate = timestampToDate(doc.data().createdAt);

        id.textContent = "Id: " + doc.id;
        time.textContent = "Date: " + createdDate.toLocaleString(undefined, {
            hour12: false,
            weekday: "long",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
        email.textContent = "Email: " + doc.data().email;
        message.textContent = doc.data().message;

        box.className = "posts";
        if (document.getElementById("darktest").classList.contains('darkmode')) {
            box.className += ' darkmode';
            console.log("Darkmode added to div")
        }
        box.append(id, time, email, message);
        document.getElementById("message-bottom").before(box);
    });
}

function redirectToHome() {
    window.location.href = "/about.html";
}

// What to do after login
function showAdminContent(uid, number) {
    loginForm.style.display = "none";
    const message = document.createElement("p");
    if (number == 0) {
        message.textContent = `You have successfully logged in! Your UID: ${uid}`;
    }
    else if (number == 1) {
        message.textContent = `Welcome. Your UID: ${uid}`;
    }
    document.getElementById("message-bottom").before(message);
    loadContacts();
    document.getElementById("logout").style.display = "";
    document.getElementById("message-bottom").innerText = "";
}

if (document.getElementById("message-bottom") !== null) {
    const auth = getAuth(app);
    const loginForm = document.getElementById("loginForm");

    // Handle login form submission
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        console.log("Logging in...")

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is admin
            const adminSnap = await getDoc(doc(db, "admins", user.uid));
            if (adminSnap.exists()) {
            // showAdminContent(user.uid, 0);
            }
            else {
            alert("Access denied: You are not an admin.");
            await signOut(auth);
            redirectToHome();
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed: " + error.message);
        }
    });

    // Listen for auth state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const adminSnap = await getDoc(doc(db, "admins", user.uid));
            if (adminSnap.exists()) {
                showAdminContent(user.uid, 1);
            } else {
                await signOut(auth);
                redirectToHome();
            }
        } else {
            document.getElementById("message-bottom").innerText = "Please log in to access the admin page.";
        }
    });
    document.getElementById("logout").addEventListener("click", async () => {
        try {
            await signOut(auth);
            redirectToHome();
        } catch (err) {
            console.error("Logout failed:", err);
        }
    });
}
window.loadContacts = loadContacts;