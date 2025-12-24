// Version 12/23/2025

// Firebase stuff
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, doc, getDoc, getDocs, setDoc, arrayUnion, increment, arrayRemove, where, onSnapshot, deleteDoc 
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
const messageCollection = collection(db, 'chats');
let chatId = '';

// Functions
async function sendMessage(messageData) {
    if (!messageData.text.trim() || !chatId) {
        return;
    }; 
    // metaRef is main data doc, metaSnap is a snapshot of that main data doc
    const metaRef = doc(db, "chats", chatId);
    const metaSnap = await getDoc(metaRef);
    const messageCount = metaSnap.data().totalMessages || 0;
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
    console.log(`targetBucket: ${targetBucket}, messageData.text: ${messageData.text}, date: ${new Date().toISOString()}`)
    await setDoc(metaRef, {
        totalMessages: increment(1),
        currentBucket: targetBucket,
        lastMessage: messageData.text,
        updatedAt: new Date().toISOString()
    }, { merge: true });
};
async function updateChat(user) {
    if (!chatId) {
        document.getElementById('chatTitle').innerText = '';
        document.getElementById('chatBar').style.display = 'none';
        document.getElementById('typeBar').style.display = 'none';
        document.querySelectorAll('.posts').forEach((e) => {
            e.remove();
        });
        document.getElementById('typeInput').value = '';
        return;
    };
    const metaRef = doc(db, "chats", chatId);
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.data() !== null) {
        if (metaSnap.data().title !== null) {
        document.getElementById("chatTitle").innerText = metaSnap.data().title.trim();
        };
    };
    const bucketRef = doc(db, "chats", `${chatId}_${metaSnap.data().currentBucket}`);
    const bucketSnap = await getDoc(bucketRef);

    let messagesArray = [];

    if (bucketSnap.exists()) {
        messagesArray = bucketSnap.data().messages || [];

        messagesArray.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }

    document.querySelectorAll(".posts").forEach(e => {e.remove();});

    const nameCache = {}; 

    for (const e of messagesArray) {
        const box = document.createElement("div");
        const p = document.createElement("p");
        box.className = 'posts';

        if (document.getElementById("darktest").classList.contains('darkmode')) {
            box.className += ' darkmode';
        };

        if (e.user == user.uid) {
            box.classList.add('right');
            p.textContent = e.text;
        } else {
            box.classList.add('left');

            if (nameCache[e.user]) {
                p.textContent = `${nameCache[e.user]}: ${e.text}`;
            } else {
                const usersSnap = await getDoc(doc(db, 'users', e.user));
                const name = usersSnap.exists() ? usersSnap.data().displayName : e.user;
                
                nameCache[e.user] = name;
                p.textContent = `${name}: ${e.text}`;
            };
        };

        box.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            
        });

        box.append(p);
        document.getElementById("messageBottom").before(box);
    };
};
async function getChatList(snapshot, user) {
    document.querySelectorAll('.chats').forEach(e => {
        e.remove();
    })
    snapshot.docs.map(doc => {
        // doc is each document that was found that the user was in
        const data = doc.data();
        const box = document.createElement("div");
        const h2 = document.createElement("h2");
        const p = document.createElement("p");

        box.className = "chats";
        h2.textContent = data.title || doc.id;
        p.textContent = data.lastMessage || 'none';
        if (document.getElementById("darktest").classList.contains('darkmode')) {
            box.className += ' darkmode';
        };

        box.addEventListener('click', (e) => {
            e.preventDefault();
            chatId = doc.id;
            updateChat(user);
            document.getElementById('chatBar').style.display = '';
            document.getElementById('typeBar').style.display = '';

            if (window.innerWidth <= 600) {
                document.body.classList.add('chat-open');
            };
        });

        box.append(h2, p);
        document.getElementById("chatBottom").before(box);
    });
};
async function createChatMenu(userUID) {
    const h2 = document.createElement('h2');
    const box = document.createElement("div");
    const form = document.createElement('form');
    const title = document.createElement('input');
    const submit = document.createElement('button');
    const cancel = document.createElement('button');

    h2.textContent = 'Create New Chat';
    submit.textContent = 'Create';
    title.placeholder = 'Chat title';
    cancel.textContent = 'Cancel'
    
    form.id = 'createChatForm';
    box.id = 'createChatBox';
    h2.id = 'createChatTitle';
    title.id = 'createChatInput';
    submit.id = 'createChatSubmit';
    cancel.id = 'createChatCancel';
    submit.type = 'submit';
    
    if (document.getElementById("darktest").classList.contains('darkmode')) {
        box.className += ' darkmode';
    };

    form.append(h2, title, submit, cancel);
    box.append(form);
    document.getElementById("main").after(box);

    document.getElementById('createChatCancel').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById("createChatBox").remove();
    });
    document.getElementById("createChatForm").addEventListener('submit', (e) => {
        e.preventDefault();

        chatTitle = document.getElementById("createChatInput").value || 'Chat Title';

        createChat(chatTitle, userUID);
        document.getElementById("createChatBox").remove();
    });
};
async function createChat(chatTitle, userUID) {
    const newChat = addDoc(messageCollection, {
        participants: [userUID],
        owner: userUID,
        title: chatTitle,
        totalMessages: 0,
        currentBucket: 1,
        lastMessage: '',
        updatedAt: new Date()
    });
    chatId = newChat.id;
};
async function addUser(userUID) {
    const metaRef = doc(db, "chats", chatId);
    const q = query(
        collection(db, 'users'), 
        where('username', "==", userUID)
    );
    const userSnap = await getDocs(q);
    const metaSnap = await getDoc(metaRef)
    if (metaSnap.data().participants.includes(userUID)) {
        console.log('Adding user with user uid.');
        await setDoc(metaRef, {
            participants: arrayUnion(userUID),
            updatedAt: new Date()
        }, { merge: true });
    } else if (!userSnap.docs[0].empty) {
        console.log('Adding user with username.');
        await setDoc(metaRef, {
            participants: arrayUnion(userSnap.docs[0].id),
            updatedAt: new Date()
        }, { merge: true });
    } else {
        console.log(`The entered user id or username has not been found to match any in the database.`)
    }
};
async function removeUser(userUID, removeChatId) {
    const metaRef = doc(db, "chats", removeChatId);
    await setDoc(metaRef, {
        participants: arrayRemove(userUID),
        updatedAt: new Date()
    }, { merge: true });
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.data().participants.length === 0) {
        for (let i = metaSnap.data().currentBucket; i >= 0; i--) {
            await deleteDoc(doc(db, 'chats', `${removeChatId}_${i}`));
        }
        await deleteDoc(metaRef);
    };
};
async function renameChat(name) {
    const metaRef = doc(db, "chats", chatId);
    await setDoc(metaRef, {
        title: name,
        updatedAt: new Date()
    }, { merge: true });
};

onAuthStateChanged(auth, async (user) => {
    // Detect if user is logged in or not. If not, this leads them to the login page to be redirected back here.
    if (!user) {
        alert("Please login to access the chat service. This is implemented for safety reasons.")
        window.location.href = '/login.html?redirect=/chat/';
    };
    // Below should be code to run after firebase firestore load

    let popupActive = false;
    const q = query(messageCollection, where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));

    onSnapshot(q, async (snapshot) => {
        console.log("Database changed.");
        if (chatId !== '') {
            updateChat(user);
        };
        getChatList(snapshot, user);
    });
    document.getElementById("chatCreate").addEventListener('click', () => {
        createChatMenu(user.uid);
    });
    {
    document.getElementById('addUser').addEventListener('click', () => {
        if (chatId && popupActive === false) {
            popupActive = true;
            const box = document.createElement('div');
            const h2 = document.createElement('h2');
            const form = document.createElement('form');
            const input = document.createElement('input');
            const submit = document.createElement('button');
            const cancel = document.createElement('button');

            h2.textContent = 'Add new user';
            submit.textContent = 'Add';
            input.placeholder = 'username or user id';
            cancel.textContent = 'Cancel'
            
            form.id = 'addUserForm';
            box.id = 'addUserBox';
            h2.id = 'addUserTitle';
            input.id = 'addUserInput';
            submit.id = 'addUserSubmit';
            cancel.id = 'addUserCancel';
            submit.type = 'submit';

            if (document.getElementById("darktest").classList.contains('darkmode')) {
                box.className += ' darkmode';
            };

            form.append(h2, input, submit, cancel);
            box.append(form);
            document.getElementById('main').after(box);

            document.getElementById('addUserForm').addEventListener('submit', (e) => {
                e.preventDefault();

                if (document.getElementById('addUserInput').value.trim()) {
                    addUser(document.getElementById('addUserInput').value.trim());
                }

                document.getElementById('addUserBox').remove();
                popupActive = false;
            });
            document.getElementById('addUserCancel').addEventListener('click', () => {
                document.getElementById('addUserBox').remove();
                popupActive = false;
            });
        };
    });
    document.getElementById('removeUser').addEventListener('click', async () => {
        if (chatId && popupActive === false) {
            popupActive = true;
            const box = document.createElement('div');
            const h2 = document.createElement('h2');
            const form = document.createElement('form');
            const submit = document.createElement('button');
            const cancel = document.createElement('button');

            h2.textContent = 'Remove user';
            submit.textContent = 'Remove';
            cancel.textContent = 'Cancel'
            
            form.id = 'removeUserForm';
            box.id = 'removeUserBox';
            h2.id = 'removeUserTitle';
            submit.id = 'removeUserSubmit';
            cancel.id = 'removeUserCancel';
            submit.type = 'submit';
            
            if (document.getElementById("darktest").classList.contains('darkmode')) {
                box.className += ' darkmode';
            };

            const listRef = doc(db, 'chats', chatId);
            const list = await getDoc(listRef);
            const participants = list.data().participants;
            let input = [];

            for (const e of participants) {
                const checkbox = document.createElement('input');
                const label = document.createElement('label');
                const br = document.createElement('br');
                checkbox.type = 'checkbox';
                checkbox.value = e;
                checkbox.name = 'removeUser';
                let text = e;
                const usersRef = doc(db, 'users', e);
                const usersSnap = await getDoc(usersRef);
                if (user.uid == e) {
                    text = 'Yourself';
                } else if (usersSnap.exists()) {
                    text = usersSnap.data().username;
                }
                label.append(checkbox, text, br);

                input.push(label);
            };

            form.append(h2, ...input, submit, cancel);
            box.append(form);
            document.getElementById('main').after(box);

            document.getElementById('removeUserForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const checkedBoxes = document.querySelectorAll('input[name="removeUser"]:checked');
                const removeList = Array.from(checkedBoxes).map(cb => cb.value);

                const removeChatId = chatId;

                await removeList.forEach(async (b) => {
                    await removeUser(b, removeChatId);
                });
                if (removeList.includes(user.uid)) {
                    chatId = '';
                };
                updateChat(user);
                document.getElementById('removeUserBox').remove();
                popupActive = false;
            });

            document.getElementById('removeUserCancel').addEventListener('click', () => {
                document.getElementById('removeUserBox').remove();
                popupActive = false;
            });
        };
    });
    }
    {
    document.getElementById('settingsIconButton').addEventListener('click', async () => {
        if (popupActive === false) {
            popupActive = true;
            const box = document.createElement('div');
            const h2 = document.createElement('h2');
            const x = document.createElement('h2');
            const topBox = document.createElement('div');
            const profile = document.createElement('a');
            const form = document.createElement('form');
            const chatTitle = document.createElement('input');
            const participantsList = document.createElement('p');
            const save = document.createElement('button');

            const listRef = doc(db, 'chats', chatId);
            const list = await getDoc(listRef);
            const title = list.data().title;
            let participants = list.data().participants;

            box.id = 'settingsBox';
            h2.textContent = 'Chat  Settings';
            h2.id = 'settingsTitle';
            x.id = 'settingsCancel';
            x.textContent = 'X';
            topBox.id = 'settingsTopBox'
            profile.textContent = 'Profile settings';
            profile.href = '/login.html';
            form.id = 'settingsForm';
            chatTitle.value = title;
            chatTitle.id = 'settingsInput';
            participantsList.append('Chat Members: ', document.createElement('br'));
            for (const uid of participants) {
                const docSnap = await getDoc(doc(db, 'users', uid));
                if (docSnap.exists()) {
                    participantsList.append(docSnap.data().username, document.createElement('br'));
                } else {
                    console.log('Username not yet given');
                    participantsList.append(uid, document.createElement('br'));
                };
            };
            save.id = 'settingsSave';
            save.textContent = 'Save';

            form.append(chatTitle, save);
            topBox.append(h2, x);
            box.append(topBox, profile, document.createElement('br'), 'Chat Title: ', document.createElement('br'),form, participantsList);
            document.getElementById('main').after(box);

            document.getElementById('settingsCancel').addEventListener('click', () => {
                document.getElementById('settingsBox').remove();
                popupActive = false;
            });

            document.getElementById('settingsForm').addEventListener('submit', (e) => {
                e.preventDefault();

                const newTitle = document.getElementById('settingsInput').value.trim();

                if (newTitle) {
                    renameChat(newTitle);
                };
                document.getElementById('settingsBox').remove();
                popupActive = false;
            });
        };
    });
    }
    {
    const tx = document.getElementById('typeInput');

    // Set textarea size after page load
    tx.style.height = "auto";
    tx.style.height = (tx.scrollTop + tx.scrollHeight) + "px";

    tx.addEventListener("input", function() {
        // Reset height to calculate correctly
        this.style.height = "auto";
        // Set height based on scroll height
        this.style.height = (this.scrollTop + this.scrollHeight) + "px";
    });
    tx.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 601) {
            e.preventDefault();
            const message = {
                user: user.uid,
                text: document.getElementById("typeInput").value.trim()
            };
            sendMessage(message);
            document.getElementById("typeInput").value = "";
            this.style.height = "auto";
            this.style.height = (this.scrollTop + this.scrollHeight) + "px";
        };
    });
    document.getElementById("typeForm").addEventListener('submit', (e) => {
        e.preventDefault();
        const message = {
            user: user.uid,
            text: document.getElementById("typeInput").value.trim()
        };
        sendMessage(message);
        document.getElementById("typeInput").value = "";
        tx.style.height = "auto";
        tx.style.height = (tx.scrollTop + tx.scrollHeight) + "px";
    });
    }
});

{
const resizer = document.getElementById('resizer');
const leftSide = document.getElementById('chatsBox');

let isResizing = false;

// --- RESIZING LOGIC (MOUSE & TOUCH) ---

function handleMove(clientX) {
    if (!isResizing) return;

    let newWidth = clientX;

    const minSidebarVW = 10;
    const minMessagesVW = 30;

    const minSidebarPx = (minSidebarVW * window.innerWidth) / 100;
    const minMessagesPx = (minMessagesVW * window.innerWidth) / 100;
    const maxAllowedWidth = window.innerWidth - minMessagesPx;

    if (newWidth < minSidebarPx) newWidth = minSidebarPx;
    if (newWidth > maxAllowedWidth) newWidth = maxAllowedWidth;

    leftSide.style.flex = 'none'; 
    leftSide.style.width = newWidth + 'px';
}

// Mouse Move Handler
function onMouseMove(e) {
    handleMove(e.clientX);
}

// Touch Move Handler
function onTouchMove(e) {
    // Prevent screen scrolling while resizing
    if (e.cancelable) e.preventDefault(); 
    handleMove(e.touches[0].clientX);
}

function stopResizing() {
    isResizing = false;
    document.body.classList.remove('resizing-active');
    
    // Remove Mouse Listeners
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    
    // Remove Touch Listeners
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', stopResizing);
}

// Start Resizing for Mouse
resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.classList.add('resizing-active');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopResizing);
});

// Start Resizing for Touch
resizer.addEventListener('touchstart', (e) => {
    isResizing = true;
    document.body.classList.add('resizing-active');
    // passive: false is required to allow e.preventDefault() in onTouchMove
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', stopResizing);
});
}
{
const mainContainer = document.body;
const menuBtn = document.getElementById('menuIconButton');
const allChats = document.querySelectorAll('.chats');

// 1. When clicking the Menu Button on mobile, go BACK to the list
menuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.innerWidth <= 600) {
        mainContainer.classList.remove('chat-open'); // Slide messages away
    } else {
        // Desktop toggle logic
        chatsBox.classList.toggle('hidden-sidebar');
    }
});

// 2. When clicking a chat in the list, OPEN the messages
allChats.forEach(chat => {
    chat.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.innerWidth <= 600) {
            mainContainer.classList.add('chat-open'); // Slide messages in
        }
    });
});
}