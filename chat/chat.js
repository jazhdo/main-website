// Version 12/31/2025

// Firebase stuff
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, doc, getDoc, getDocs, setDoc, arrayUnion, increment, arrayRemove, where, onSnapshot, deleteDoc, runTransaction 
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
let popupActive = false;
let editMessageStatus = {
    status: false,
    docId: '',
    index: 0
};
let replyMessageStatus = {
    status: false,
    text: '',
    user: ''
};

// Functions
async function sendMessage(messageData, user) {
    if (!messageData.text.trim() || !chatId) {
        return;
    } else if (editMessageStatus.status === true) {
        await editMessage(editMessageStatus.docId, editMessageStatus.index, messageData.text);
        editMessageStatus.status = false;
        // updateChat(user);
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
    if (replyMessageStatus.status === false) {
        await setDoc(bucketRef, {
            messages: arrayUnion({
            ...messageData,
            timestamp: new Date().toISOString()
            })
        }, { merge: true }); // This is to add the bucket doc (doc_1, doc_2, doc_3, etc. for the same chat) in case it has not yet been created
    } else if (replyMessageStatus.status === true) {
        await setDoc(bucketRef, {
            messages: arrayUnion({
            replyToUser: replyMessageStatus.user,
            replyToText: replyMessageStatus.text,
            ...messageData,
            timestamp: new Date().toISOString()
            })
        }, { merge: true });
        document.getElementById('replyBar').remove();
        replyMessageStatus.status = false;
    };

    // Add info to main data doc
    console.log(`targetBucket: ${targetBucket}, messageData.text: ${messageData.text}, date: ${new Date().toISOString()}`)
    await setDoc(metaRef, {
        totalMessages: increment(1),
        currentBucket: targetBucket,
        lastMessage: messageData.text,
        updatedAt: new Date().toISOString()
    }, { merge: true });
};
function openContextMenu(a, e, user, option, b, metaSnap, messagesArray) {
    const menu = document.createElement('div');
    const title = document.createElement('h2');
    const x = document.createElement('h2');
    const reply = document.createElement('p');
    const copy = document.createElement('p');
    const back = document.createElement('div');

    [menu, reply, copy].forEach((e) => e.className += document.getElementById("darktest").classList.contains('darkmode')? ' darkmode' : '');

    menu.id = 'contextMenuBox';
    title.textContent = 'Menu';
    title.id = 'contextMenuTitle';
    reply.textContent = 'Reply';
    reply.id = 'contextMenuReply';
    x.textContent = 'X';
    x.id = 'contextMenuClose';
    copy.textContent = 'Copy';
    copy.id = 'contextMenuCopy';
    back.id = 'clickableBackground';

    back.style.width = '100vw';
    back.style.height = '100vh';
    back.style.zIndex = '1000';
    back.style.position = 'absolute';
    back.style.opacity = '0';
    menu.append(title, x);
    if (e.user == user.uid) {
        const edit = document.createElement('p');
        edit.textContent = 'Edit';
        edit.id = 'contextMenuEdit';
        edit.className += document.getElementById("darktest").classList.contains('darkmode')? ' darkmode' : '';
        menu.append(copy, edit, reply);
    } else {
        menu.append(copy, reply);
    };
    document.getElementById('main').after(menu, back);

    const menuBoxElement = document.getElementById('contextMenuBox');
    if (option == 'computer') {
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 2. Calculate Horizontal Position (Left/Right)
        let left = a.pageX;
        if (a.clientX + menuWidth > windowWidth) {
            // If it goes off the right edge, move it to the left of the cursor
            left = a.pageX - menuWidth;
        }

        // 3. Calculate Vertical Position (Top/Bottom)
        let top = a.pageY;
        if (a.clientY + menuHeight > windowHeight) {
            // If it goes off the bottom edge, move it above the cursor
            top = a.pageY - menuHeight;
        }

        // 4. Apply the safe coordinates
        menuBoxElement.style.left = left + 'px';
        menuBoxElement.style.top = top + 'px';
    } else if (option == 'mobile') {
        let m = menuBoxElement.style;
        m.position = 'absolute';
        m.backgroundColor = 'lightgreen';
        m.top = '50%';
        m.left = '50%';
        m.transform = 'translate(-50%, -50%)';
        m.borderRadius =  '3vw';
        m.padding = '2vw';
        m.zIndex = '1000';
    } else {
        console.log('Option has not returned true or false.');
    };
    
    const close = () => {
        document.getElementById('contextMenuBox').remove();
        document.getElementById('clickableBackground').remove();
        popupActive = false;
    };

    document.getElementById('contextMenuReply').addEventListener('click', async () => {
        document.getElementById('typeInput').focus();
        replyMessageStatus.status = true;
        replyMessageStatus.text = (messagesArray.length - 1) - b;
        const usersSnap = await getDoc(doc(db, 'users', e.user));
        replyMessageStatus.user = usersSnap.exists() ? usersSnap.data().displayName : e.user;
        const bar = document.createElement('div');
        const text = document.createElement('p');
        text.textContent = `Replying to: ${e.text}`;
        bar.id = 'replyBar';
        bar.append(text);
        document.getElementById('typeBar').before(bar);
        close();
    });

    if (e.user == user.uid) {
        document.getElementById('contextMenuEdit').addEventListener('click', async () => {
            document.getElementById('typeInput').focus();
            document.getElementById('typeInput').value = e.text;

            editMessageStatus.status = true;
            editMessageStatus.docId = `${chatId}_${metaSnap.data().currentBucket}`;
            editMessageStatus.index = (messagesArray.length - 1) - b;
            close();
        });
    };
    document.getElementById('contextMenuCopy').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(e.text);
            console.log(`Copied message: '${e.text}'`);
        } catch (error) {
            console.error("Failed to copy: ", error);
        };
        close();
    });
    document.getElementById('contextMenuClose').addEventListener('click', close)
    document.getElementById('clickableBackground').addEventListener('click', close);
};
async function updateChat(user) {
    if (!chatId) {
        document.getElementById('chatTitle').innerText = '';
        document.getElementById('chatBar').style.display = 'none';
        document.getElementById('typeBar').style.display = 'none';
        document.querySelectorAll('.posts, .timestamp').forEach((e) => {
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

    document.querySelectorAll(".posts, .timestamp").forEach(e => {e.remove();});

    const nameCache = {}; 

    for (const [b, e] of messagesArray.entries()) {
        const time = document.createElement("p");
        const box = document.createElement("div");
        const p = document.createElement("p");

        box.className = 'posts';
        box.className += document.getElementById("darktest").classList.contains('darkmode')? ' darkmode' : '';
        time.className = 'timestamp';

        const date = new Date(e.timestamp);
        const datePart = date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });

        const timePart = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Set to true if you want AM/PM
        });
        time.innerText = `${datePart} at ${timePart}`;
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
        if (e.edited) {
            p.textContent = p.textContent + ' (edited)';
        };
        if (e.replyToText && e.replyToUser) {
            const replyBox = document.createElement('div');
            const replyUser = document.createElement('p');
            const replyText = document.createElement('p');
            replyBox.className = 'replyBox';
            replyUser.textContent = e.replyToUser;
            const unsortedMessages = [...messagesArray].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
            try {
                replyText.textContent = unsortedMessages[e.replyToText].text;
            } catch {
                replyText.textContent = e.replyToText;
            };
            replyBox.append(replyUser, replyText);
            box.append(replyBox);
        };
        
        let pressTimer;
        box.addEventListener("pointerdown", (a) => {
            a.preventDefault();
            // body.classList.
            pressTimer = setTimeout(() => {
                clearTimeout(pressTimer);
                openContextMenu(a, e, user, 'mobile', b, metaSnap, messagesArray);
            }, 500);
        });
        function cancel() {
            clearTimeout(pressTimer);
        };
        box.addEventListener("pointerup", cancel);
        box.addEventListener("pointerleave", cancel);
        box.addEventListener("pointercancel", cancel);

        box.addEventListener('contextmenu', (a) => {
            a.preventDefault();
            if (popupActive === false) {
                popupActive = true;
                openContextMenu(a, e, user, 'computer', b, metaSnap, messagesArray);
            };
        });
        box.append(p);
        console.log(`Loading message with time ${date} and message ${e.text}`);
        document.getElementById("messageBottom").before(box, time);
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
    } else if (!userSnap.empty) {
        console.log('Adding user with username.');
        await setDoc(metaRef, {
            participants: arrayUnion(userSnap.docs[0].id),
            updatedAt: new Date()
        }, { merge: true });
    } else {
        console.log(`The entered user id or username has not been found to match any in the database.`);
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
async function editMessage(docId, indexToEdit, newText) {
    const docRef = doc(db, "chats", docId);
    const metaRef = doc(db, "chats", chatId);
    
    try {
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) return;
            let messages = sfDoc.data().messages || [];
            if (messages[indexToEdit]) {
                messages[indexToEdit].text = newText;
                messages[indexToEdit].edited = true;

                transaction.update(docRef, { messages: messages });
            } else {
                alert("Index not found in array");
            }
        });
        console.log(`Message #${indexToEdit + 1} has been edited to'${newText}'`);
    } catch (e) {
        alert(`Editing the message has failed because of error: ${e}`);
    };
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.data().totalMessages === messages.length - 1) {
        console.log('Changing lastMessage...');
        await setDoc(metaRef, {
            lastMessage: newText,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } else {
        await setDoc(metaRef, {
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }
};
onAuthStateChanged(auth, async (user) => {
    // Detect if user is logged in or not. If not, this leads them to the login page to be redirected back here.
    if (!user) {
        alert("Please login to access the chat service. This is implemented for safety reasons.")
        window.location.href = '/login.html?redirect=/chat/';
    };
    // Below should be code to run after firebase firestore load
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

            box.className += document.getElementById('darktest').classList.contains('darkmode')?' darkmode':'';

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
            
            box.className += document.getElementById('darktest').classList.contains('darkmode')?' darkmode':'';

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

            box.className += document.getElementById('darktest').classList.contains('darkmode')?' darkmode':'';
            profile.className += document.getElementById('darktest').classList.contains('darkmode')?' darkmode':'';

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
            sendMessage(message, user);
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
        sendMessage(message, user);
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