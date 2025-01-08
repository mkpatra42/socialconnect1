// Firebase configuration - Replace with your Firebase config
const firebaseConfig = {
    // Add your Firebase configuration here
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const mainContent = document.getElementById('mainContent');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const newsFeed = document.getElementById('newsFeed');
const adminPanel = document.getElementById('adminPanel');
const usersList = document.getElementById('usersList');
const postsList = document.getElementById('postsList');
const totalUsersSpan = document.getElementById('totalUsers');
const totalPostsSpan = document.getElementById('totalPosts');

// Auth state observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        document.getElementById('authForms').classList.add('hidden');
        loginBtn.classList.add('hidden');
        signupBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');

        // Check if user is admin
        const userDoc = await db.collection('users').doc(user.uid).get();
        const isAdmin = userDoc.data()?.isAdmin || false;

        if (isAdmin) {
            adminPanel.classList.remove('hidden');
            mainContent.classList.add('hidden');
            loadAdminData();
        } else {
            mainContent.classList.remove('hidden');
            adminPanel.classList.add('hidden');
            loadPosts();
        }
    } else {
        // User is signed out
        document.getElementById('authForms').classList.remove('hidden');
        mainContent.classList.add('hidden');
        adminPanel.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        signupBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
    }
});

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        alert(error.message);
    }
}

// Signup function
async function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Check if this is the first user
        const usersSnapshot = await db.collection('users').get();
        const isFirstUser = usersSnapshot.size === 0;
        
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            isAdmin: isFirstUser // First user becomes admin
        });
    } catch (error) {
        alert(error.message);
    }
}

// Logout function
function logout() {
    auth.signOut();
}

// Create post function
async function createPost() {
    const content = document.getElementById('postContent').value;
    if (!content.trim()) return;

    try {
        const user = auth.currentUser;
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        await db.collection('posts').add({
            content: content,
            authorId: user.uid,
            authorName: userDoc.data().name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('postContent').value = '';
        loadPosts();
    } catch (error) {
        alert(error.message);
    }
}

// Load posts function
async function loadPosts() {
    try {
        const snapshot = await db.collection('posts')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        newsFeed.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = createPostElement(post);
            newsFeed.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Create post element function
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    
    const timestamp = post.timestamp ? post.timestamp.toDate() : new Date();
    const timeString = timestamp.toLocaleString();

    div.innerHTML = `
        <div class="post-header">
            <span class="post-author">${post.authorName}</span>
            <span class="post-time">${timeString}</span>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
            <span class="post-action">Like</span>
            <span class="post-action">Comment</span>
            <span class="post-action">Share</span>
        </div>
    `;
    
    return div;
}

// Admin Functions
async function loadAdminData() {
    await Promise.all([
        loadUsersAdmin(),
        loadPostsAdmin(),
        updateStatistics()
    ]);
}

async function loadUsersAdmin() {
    try {
        const snapshot = await db.collection('users').get();
        usersList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <div>
                    <strong>${user.name}</strong>
                    <div>${user.email}</div>
                </div>
                <div class="admin-actions">
                    <button class="admin-btn edit" onclick="toggleUserAdmin('${doc.id}', ${!user.isAdmin})">
                        ${user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button class="admin-btn delete" onclick="deleteUser('${doc.id}')">Delete</button>
                </div>
            `;
            usersList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadPostsAdmin() {
    try {
        const snapshot = await db.collection('posts')
            .orderBy('timestamp', 'desc')
            .get();
        
        postsList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const post = doc.data();
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = `
                <div>
                    <strong>${post.authorName}</strong>
                    <div>${post.content}</div>
                    <small>${post.timestamp ? post.timestamp.toDate().toLocaleString() : 'No date'}</small>
                </div>
                <div class="admin-actions">
                    <button class="admin-btn delete" onclick="deletePost('${doc.id}')">Delete</button>
                </div>
            `;
            postsList.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

async function updateStatistics() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const postsSnapshot = await db.collection('posts').get();
        
        totalUsersSpan.textContent = usersSnapshot.size;
        totalPostsSpan.textContent = postsSnapshot.size;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

async function toggleUserAdmin(userId, makeAdmin) {
    try {
        await db.collection('users').doc(userId).update({
            isAdmin: makeAdmin
        });
        loadUsersAdmin();
    } catch (error) {
        console.error('Error updating user admin status:', error);
        alert(error.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        // Delete user's posts
        const posts = await db.collection('posts')
            .where('authorId', '==', userId)
            .get();
        
        const batch = db.batch();
        posts.forEach(post => batch.delete(post.ref));
        
        // Delete user document
        batch.delete(db.collection('users').doc(userId));
        
        await batch.commit();
        loadAdminData();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.message);
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        await db.collection('posts').doc(postId).delete();
        loadAdminData();
    } catch (error) {
        console.error('Error deleting post:', error);
        alert(error.message);
    }
}

// Event Listeners
loginBtn.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

signupBtn.addEventListener('click', () => {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

logoutBtn.addEventListener('click', logout);
