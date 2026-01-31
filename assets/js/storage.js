/**
 * storage.js
 * Firebase Database Implementation
 */

// Firebase Configuration (from user input)
const firebaseConfig = {
    apiKey: "AIzaSyAO-CTf7DVqkD-V-_mtL7e9hP5QNf7vkQM",
    authDomain: "dkotobakuis-c69a1.firebaseapp.com",
    projectId: "dkotobakuis-c69a1",
    storageBucket: "dkotobakuis-c69a1.firebasestorage.app",
    messagingSenderId: "935131530677",
    appId: "1:935131530677:web:d4f77248f542a2f39745fc"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();

// Collections
const USERS_COLLECTION = 'users';
const CONTENT_COLLECTION = 'content';
const QUIZZES_COLLECTION = 'quizzes';

// Utility to create email from username (for Admin accounts only)
const getEmail = (username) => `${username.toLowerCase()}@dkotoba.app`;

window.dbRef = null; // Global reference for legacy compatibility

class StorageManager {
    constructor() {
        this.currentUser = null;
        window.dbRef = this;
    }

    // --- Helpers ---
    async getCurrentUser() {
        // 1. Check Firebase Auth (for Admin)
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const doc = await firestore.collection(USERS_COLLECTION).doc(user.uid).get();
                    if (doc.exists) {
                        this.currentUser = { id: user.uid, ...doc.data() };
                        resolve(this.currentUser);
                    } else {
                        resolve(null);
                    }
                } else {
                    // 2. Fallback to localStorage (for Students)
                    const saved = localStorage.getItem('dkotoba_user');
                    if (saved) {
                        try {
                            this.currentUser = JSON.parse(saved);
                            resolve(this.currentUser);
                        } catch (e) {
                            localStorage.removeItem('dkotoba_user');
                            resolve(null);
                        }
                    } else {
                        this.currentUser = null;
                        resolve(null);
                    }
                }
                unsubscribe();
            });
        });
    }

    getDB() {
        // Legacy synchronous text (will fail if used synchronously, but we keep structure)
        return {
            users: [], // Can't fetch sync
            content: [],
            quizzes: [],
            currentUser: this.currentUser
        };
    }

    // --- Auth (Async) ---
    async login(username, password) {
        try {
            const inputPassword = (password || '').trim();
            // Find user in Firestore by username
            const userDoc = await this.getUserByUsername(username);

            if (!userDoc) {
                return { success: false, message: 'Username tidak ditemukan.' };
            }

            // ADMIN Flow: Strict check to avoid student falling into Firebase Auth
            const isAdmin = userDoc.username === 'admin' && (userDoc.role || '').toLowerCase() === 'admin';

            if (isAdmin) {
                const email = getEmail(username);
                const userCredential = await auth.signInWithEmailAndPassword(email, inputPassword);
                const uid = userCredential.user.uid;
                this.currentUser = { id: uid, ...userDoc };
                return { success: true, user: this.currentUser };
            }

            // STUDENT Flow: 100% Firestore-based
            // 🔴 Handle Legacy Account (No password field)
            if (!userDoc.password) {
                return {
                    success: false,
                    needActivation: true,
                    userId: userDoc.id
                };
            }

            // Verify password against Firestore (Trimmed compare)
            if (userDoc.password.trim() !== inputPassword) {
                return { success: false, message: 'Password salah.' };
            }

            // Login success for student
            this.currentUser = userDoc;
            localStorage.setItem('dkotoba_user', JSON.stringify(userDoc));
            return { success: true, user: this.currentUser };

        } catch (error) {
            console.error("Login Error:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                return { success: false, message: 'Username atau password salah.' };
            }
            return { success: false, message: 'Terjadi kesalahan saat masuk.' };
        }
    }

    async register(username, password, fullName = '') {
        try {
            // check if username exists
            const existing = await this.getUserByUsername(username);
            if (existing) {
                return { success: false, message: 'Username sudah digunakan.' };
            }

            // Students are NO LONGER created in Firebase Auth
            const newUser = {
                username: username,
                fullName: fullName,
                password: (password || '').trim(),
                role: 'user', // Default role
                score: 0,
                completedQuizzes: 0,
                history: [],
                quizHistoryDetails: {},
                createdAt: new Date().toISOString()
            };

            const docRef = await firestore.collection(USERS_COLLECTION).add(newUser);
            const uid = docRef.id;

            // Sync the ID inside the document
            await docRef.update({ id: uid });
            newUser.id = uid;

            return { success: true, user: newUser };

        } catch (error) {
            console.error("Register Error:", error);
            return { success: false, message: error.message };
        }
    }

    async checkUserStatus(username) {
        try {
            // Priority Check: Firestore (Real Source of Truth for "Username")
            const user = await this.getUserByUsername(username);
            if (user) {
                return 'existing';
            }

            // Fallback: Check Auth if needed, but Firestore should be sufficient for this app's logic
            // If strictly relying on username uniqueness in users collection:
            return 'new';

        } catch (error) {
            console.error("Check User Error:", error);
            return 'new';
        }
    }

    async getUserByUsername(username) {
        try {
            const snapshot = await firestore.collection(USERS_COLLECTION)
                .where('username', '==', username)
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error("Get User Error:", error);
            return null;
        }
    }


    async createDefaultAdmin() {
        try {
            const email = 'admin@dkotoba.app';
            const password = 'admin'; // Firebase requires min 6 chars usually... wait.
            // Firebase password must be 6 characters. User asked for 'admin' (5 chars).
            // I will use 'admin123' as actual password but maybe I should warn user?
            // "pw admin" -> length 5. Firebase will reject.
            // I will try with 'admin123' and tell the user. 
            // OR I can use a simpler trick: use a real auth user if it exists?
            // Let's try 'adminadmin' (10 chars) or 'admin123'. 
            // User specifically asked "pw admin", I will try to respect it but Firebase validation is hard.
            // I'll make it 'admin123' and notify user.

            const realPassword = 'admin123';

            const userCredential = await auth.createUserWithEmailAndPassword(email, realPassword);
            const uid = userCredential.user.uid;

            const adminUser = {
                id: uid,
                username: 'admin',
                fullName: 'Administrator',
                role: 'admin',
                firstName: 'Admin',
                createdAt: new Date().toISOString()
            };

            await firestore.collection(USERS_COLLECTION).doc(uid).set(adminUser);
            console.log("Admin created!");
            return { success: true, message: "Admin created with password: 'admin123'" };
        } catch (e) {
            console.error(e);
            return { success: false, message: e.message };
        }
    }

    async logout() {
        await auth.signOut();
        localStorage.removeItem('dkotoba_user');
        this.currentUser = null;
        window.location.href = '../../index.html';
    }

    // --- Content Management (Async) ---

    // Fetch all content
    async getContentList() {
        const snapshot = await firestore.collection(CONTENT_COLLECTION).orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addContent(title, body) {
        const newContent = {
            title,
            body,
            date: new Date().toISOString(),
            status: 'publish'
        };
        await firestore.collection(CONTENT_COLLECTION).add(newContent);
    }

    async updateContent(id, title, body) {
        await firestore.collection(CONTENT_COLLECTION).doc(id).update({
            title,
            body
        });
    }

    async deleteContent(id) {
        await firestore.collection(CONTENT_COLLECTION).doc(id).delete();
    }

    // --- Quiz Management (Async) ---

    // Fetch all quizzes
    async getQuizList() {
        const snapshot = await firestore.collection(QUIZZES_COLLECTION).orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addQuiz(title, link, questions, status, deadline = null) {
        const newQuiz = {
            title,
            link,
            questions: parseInt(questions),
            status,
            deadline,
            date: new Date().toISOString()
        };
        await firestore.collection(QUIZZES_COLLECTION).add(newQuiz);
    }

    async updateQuiz(id, title, link, questions, status, deadline = null) {
        await firestore.collection(QUIZZES_COLLECTION).doc(id).update({
            title,
            link,
            questions: parseInt(questions),
            status,
            deadline
        });
    }

    async deleteQuiz(id) {
        await firestore.collection(QUIZZES_COLLECTION).doc(id).delete();
    }

    // --- User Management (Admin) ---

    async deleteUser(id) {
        await firestore.collection(USERS_COLLECTION).doc(id).delete();
    }

    async updateUser(id, data) {
        try {
            // Field-specific update strategy to protect other user data
            const updateData = {
                fullName: data.fullName ?? '',
                username: (data.username || '').trim()
            };

            // Sanitize role
            const role = (data.role || '').toLowerCase();
            if (role === 'admin' || role === 'user') {
                updateData.role = role;
            }

            // Only update password if provided and not empty
            if (typeof data.password === 'string' && data.password.trim() !== '') {
                updateData.password = data.password.trim();
            }

            await firestore.collection(USERS_COLLECTION).doc(id).update(updateData);

            // Return updated user data
            return { success: true, user: { id, ...updateData }, message: "User updated" };
        } catch (e) {
            console.error(e);
            return { success: false, message: e.message };
        }
    }

    // --- User Progress / Leaderboard ---

    // Get all users for leaderboard
    async getAllUsers() {
        const snapshot = await firestore.collection(USERS_COLLECTION).where('role', '==', 'user').get(); // orderBy score desc? need index
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async updateUserProgress(userId, score, quizId, answers, duration = null) {
        const userRef = firestore.collection(USERS_COLLECTION).doc(userId);

        // Transaction to ensure atomic updates
        await firestore.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw "User does not exist!";
            }

            const userData = userDoc.data();
            const history = userData.history || [];
            const quizHistoryDetails = userData.quizHistoryDetails || {};

            const alreadyDone = history.includes(quizId);

            let newScore = userData.score || 0;
            let newCompleted = userData.completedQuizzes || 0;

            if (!alreadyDone) {
                newScore += score;
                newCompleted += 1;
                history.push(quizId);
            }

            // Update details
            quizHistoryDetails[quizId] = {
                score: score,
                answers: answers,
                duration: duration,
                date: new Date().toISOString()
            };

            transaction.update(userRef, {
                score: newScore,
                completedQuizzes: newCompleted,
                history: history,
                quizHistoryDetails: quizHistoryDetails
            });
        });
    }
}

// Global Init
window.dbRef = new StorageManager();
