// Version 12/21/2025

// Firebase stuff
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, query, orderBy, doc, getDoc, setDoc, where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword 
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

// Check if the form is submitted
if (document.getElementById("contactForm") !== null) {
    let currentlyWorking = false;
    document.getElementById("contactForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (currentlyWorking === false) {
            currentlyWorking = true;
            // Get trimmed values (Whitespace in front & back removed)
            const email = document.getElementById("contactEmail").value.trim();
            const message = document.getElementById("contactMessage").value.trim();
            const sentDate = new Date()

            // Prevent blank submissions
            if (!email || !message) {
                window.showAlert("Please fill in both the email and message fields before submitting.");
                return; // Stop the submission
            }
            
            document.getElementById("contactForm").style.display = "none";
            document.getElementById("contactFormStatus").style.display = "";

            try {
                const record = await addDoc(collection(db, "messages"), {
                    email: email,
                    message: message,
                    createdAt: sentDate
                });
                window.showAlert("Thank you! Your message was successfully sent. \
                    Here's your message ID for future inquiries: " + record.id);
                document.getElementById("contactForm").reset();
            } catch (error) {
                window.showAlert("There was an error sending the message: ", error, ". \
                    Please try again later or on a different device.");
                window.showAlert("Oops! Something went wrong.");
            };
            document.getElementById("contactForm").style.display = "";
            document.getElementById("contactFormStatus").style.display = "none";
            currentlyWorking = false;
        }
    });
}
function timestampToDate(ts) {
    if (!ts) {
        console.error("Nothing was provided when timestampToDate was called.");
        return null;
    }
    if (ts.toDate) return ts.toDate();
    if (ts.seconds) {
        return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1_000_000);
    }
    return null;
};
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
        box.style.display = "none";
        if (document.getElementById("darktest").classList.contains('darkmode')) {
            box.className += ' darkmode';
            console.log("Darkmode added to posts")
        }
        box.append(id, time, email, message);
        document.getElementById("message-bottom").before(box);
    });
}

function redirectToHome() {
    window.location.href = "/login.html";
}

// Show after logged in on admin page
let showMessages = false;
function showAdminContent(user) {
    const message = document.createElement("p");
    const showButton = document.createElement("button");
    showButton.textContent = "Show messages";
    showButton.id = "showMessages";
    showButton.onclick = () => {
        if (showMessages === false) {
            document.querySelectorAll(".posts").forEach(e => {
                e.style.display = "";
                document.getElementById("showMessages").innerText = "Hide messages";
            });
            showMessages = true;
        } else if (showMessages === true) {
            document.querySelectorAll(".posts").forEach(e => {
                e.style.display = "none";
                document.getElementById("showMessages").innerText = "Show messages";
            });
            showMessages = false;
        }
    };
    message.textContent = `Welcome. You are signed in as UID: ${user.uid} Email: ${user.email}`;
    document.getElementById("message-bottom").before(message, showButton);
    loadContacts();
    document.querySelectorAll(".posts").forEach(e => {
        e.style.display = "";
    });
    document.getElementById("adminTitle").style.display = "";
    document.getElementById("goBack").style.display = "";
    document.getElementById("message-bottom").innerText = "";
}

async function profileLoad(user) {
    document.getElementById("profileUID").innerText = `User UID: ${user.uid}`
    document.getElementById("profileEmail").innerText = `User Email: ${user.email}`
    const chatLink = document.createElement('a');
    chatLink.href = '/chat/';
    chatLink.textContent = 'link';
    document.getElementById('chatLink').innerText = 'Chat link: ';
    document.getElementById('chatLink').append(chatLink);

    const form = document.createElement('form');
    const username = document.createElement('p');
    const input = document.createElement('input');
    const displayName = document.createElement('p');
    const input2 = document.createElement('input');
    const submit = document.createElement('button');
    const userRef = doc(db, 'users', user.uid);
    const usersSnap = await getDoc(userRef);

    if (usersSnap.data() !== undefined) {
        input.value = usersSnap.data().username;
        input2.value = usersSnap.data().displayName;
    } else {
        await setDoc(userRef, {
            username: user.uid,
            displayName: user.uid
        }, { merge: true });
        input.value = user.uid;
        input2.value = user.uid;
    };
    username.textContent = 'Username: ';
    displayName.textContent = 'Display name: ';
    submit.textContent = 'save';

    input.id = 'username';
    input2.id = 'displayName';
    form.id = 'profileForm';
    submit.id = 'profileSubmit';
    
    username.append(input);
    displayName.append(input2);
    form.append(username, displayName, submit);

    document.getElementById('profileEmail').before(form);

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('username').value.trim();
        const newDisplayName = document.getElementById('displayName').value.trim();

        const q = query(collection(db, "users"), where("username", "==", newUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty && querySnapshot.docs[0].id !== user.uid) {
            alert("Username is already taken! Please choose another.");
            document.getElementById('username').value = usersSnap.data().username;
            return;
        }
        if (newUsername.length == 28) {
            alert("Username has a possibility of being a user id. Please choose another.");
            return;
        }
        await setDoc(userRef, {
            username: newUsername, 
            displayName: newDisplayName
        }, { merge: true });
        console.log(`Username changed to '${newUsername}'.`)
        console.log(`Display name changed to '${newDisplayName}'.`)
    });
    document.getElementById('copyUID').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(user.uid);
            console.log(`Copied message: '${user.uid}'`);
        } catch (err) {
            console.error("Failed to copy: ", err);
        };
    });
};

let loginOption = true;
let loginError = false;
if (document.getElementById("loginForm") !== null) {
    // After user clicks login instead or sign up instead
    document.getElementById("otherInstead").addEventListener("click", () => {
        if (loginOption === true) {
            document.getElementById("loginTitle").innerText = "Sign Up";
            document.getElementById("loginRules").innerText = "Requirements: Valid email address, 6+ characters password";
            document.getElementById("loginSubmit").innerText = "Sign Up";
            document.getElementById("otherInstead").innerText = "Login instead";
            loginOption = false;
        } else if (loginOption === false) {
            document.getElementById("loginTitle").innerText = "Login";
            document.getElementById("loginRules").innerText = "";
            document.getElementById("loginSubmit").innerText = "Login";
            document.getElementById("otherInstead").innerText = "Sign up instead";
            loginOption = true;
        };
    });
    // What to do after firebase loads or auth change detected
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const urlData = new URLSearchParams(window.location.search);
                if (urlData.get('redirect') !== null) {
                    window.location.href = urlData.get('redirect');
                };
            } catch (error) {
                window.showAlert(`Url redirect detection broken. Error: ${error}.`)
            }
            console.log(`User Email: ${user.email}`);
            console.log(`User UID: ${user.uid}`);
            
            document.getElementById("login").style.display = "none";
            document.getElementById("content").style.display = "";
            
            profileLoad(user);

            // Check if user is admin
            const adminSnap = await getDoc(doc(db, "admins", user.uid));
            if (adminSnap.exists()) {
                if (document.getElementById("message-bottom") !== null) {
                    showAdminContent(user);
                } else if (document.getElementById("adminLink") !== null) {
                    document.getElementById("adminLink").innerHTML = "Admin page link: <a href='admin.html'>link</a>";
                };
            };
        } else {
            document.getElementById("adminLink").innerHTML = "<p id='adminLink'></p>";
        }
    });
    document.getElementById("signOut").addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (err) {
            window.showAlert("Logout failed because of error:", err);
        };
    });
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (loginOption === true) {
            console.log("Logging in...");
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                window.showAlert(`You have successfully logged in with email address ${user.email}.`);
            } catch (error) {
                const err = error.code;
                let message = '';
                switch (err) {
                    case "auth/invalid-email":
                        message = "That is a invalid email. Please enter a valid one.";
                        break;
                    case "auth/wrong-password":
                        message = "You have entered the wrong password. Please try again.";
                        break;
                    case "auth/user-not-found":
                        message = "You have not yet signed up. Please do so by clicking the text 'Sign up' below.";
                        break;
                    case "auth/user-disabled":
                        message = "A admin of this site has disabled your account. Please go to the contact page and submit a message to learn more.";
                        break;
                    case "auth/too-many-requests":
                        message = "Unusual activity has been detected from this source. Please wait a while and then try again.";
                        break;
                    case "auth/unauthorized-domain":
                        message = "You cannot sign in with a email address ending in that domain. Please try another. (I do not make the rules, firebase does)";
                        break;
                    case "auth/invalid-credential":
                        message = "You have either entered a email that is not valid or a password that is shorter than 6 characters."
                        break;
                    default:
                        message = `Your login has failed because of error: ${error}. Please report this error with code ${err} to the developers.`;
                        break;
                };
                window.showAlert(message);
            };
        } else if (loginOption === false) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (error) {
                loginError = true;
                let message = '';
                switch (error.code) {
                    case "auth/weak-password":
                        message = "Your password must be at least 6 characters long.";
                        break;
                    case "auth/email-already-in-use":
                        message = "This email is already linked to a account. Please try another email.";
                        break;
                    case "auth/too-many-requests":
                        message = "Unusual activity has been detected from this source. Please wait a while and then try again.";
                        break;
                    default:
                        message = `Account creation error: ${error}. Please report this error with code ${error.code} to the developers.`;
                        break;
                }
                window.showAlert(message);
            };
            if (loginError === false) {
                try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    const user = userCredential.user;
                    window.showAlert(`You have successfully logged in with your email address: ${user.email}.`);
                } catch (error) {
                    window.showAlert(`Automatic sign in after sign up error: ${error}. Please report this error with code ${error.code} to the developers`);
                }
            }
        } else {
            window.showAlert(`Variable loginOption has not returned true or false. Please report the status "${loginOption}" of loginOption to the developers.`);
        }
    });
} else if (document.getElementById("message-bottom") !== null) {
    onAuthStateChanged(auth, async (user) => {
        if (user !== null) {
            try {
                const adminSnap = await getDoc(doc(db, "admins", user.uid));
                if (adminSnap.exists()) {
                    showAdminContent(user);
                } else {
                    alert("Access denied: You are not an admin. (If you actually are, ask to be added to the admins file)");
                    redirectToHome();
                };
            } catch(error) {
                window.showAlert(`There was an error getting admin details. Please try again. Error: ${error}`);
            };
        } else {
            alert("Please sign in before continuing.");
            redirectToHome();
        };
    });
};
onAuthStateChanged(auth, async (user) => {
    if (user !== null) {
        document.getElementById("login-link").innerText = "Profile";
    } else {
        document.getElementById("login-link").innerText = "Login/Sign up";
    };
});