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

// Utility to create email from username
const getEmail = (username) => `${username.toLowerCase()}@dkotoba.app`;

window.dbRef = null; // Global reference for legacy compatibility

class StorageManager {
    constructor() {
        this.currentUser = null;
        window.dbRef = this;
    }

    // --- Helpers ---
    async getCurrentUser() {
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                console.log("storage.js: Auth state changed:", user);
                if (user) {
                    // Fetch full profile from Firestore
                    console.log("storage.js: Fetching profile for uid:", user.uid);
                    const docRef = firestore.collection(USERS_COLLECTION).doc(user.uid);
                    try {
                        const doc = await docRef.get();
                        if (doc.exists) {
                            console.log("storage.js: Profile found:", doc.data());
                            this.currentUser = { id: user.uid, ...doc.data() };
                            resolve(this.currentUser);
                        } else {
                            console.warn("storage.js: Profile missing for user!");
                            // Profile missing?
                            resolve(null);
                        }
                    } catch (e) {
                        console.error("storage.js: Firestore error:", e);
                        resolve(null);
                    }
                } else {
                    console.warn("storage.js: No user logged in (user is null)");
                    this.currentUser = null;
                    resolve(null);
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
            const email = getEmail(username);
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // Get user details
            const doc = await firestore.collection(USERS_COLLECTION).doc(uid).get();
            if (doc.exists) {
                const userData = doc.data();
                this.currentUser = { id: uid, ...userData };
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: 'Data user tidak ditemukan.' };
            }
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: 'Username atau password salah.' };
        }
    }

    async register(username, password, fullName = '') {
        try {
            // check if username exists by query? 
            // Firestore rules could enforce unique, but simplest is create and catch error

            const email = getEmail(username);
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            const newUser = {
                id: uid,
                username: username,
                fullName: fullName,
                role: 'user', // Default role
                score: 0,
                completedQuizzes: 0,
                history: [], // IDs of completed quizzes
                quizHistoryDetails: {}, // Detailed answers
                createdAt: new Date().toISOString()
            };

            await firestore.collection(USERS_COLLECTION).doc(uid).set(newUser);
            return { success: true, user: newUser };

        } catch (error) {
            console.error("Register Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                return { success: false, message: 'Username sudah digunakan.' };
            }
            return { success: false, message: error.message };
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

    async addQuiz(title, link, questions, status) {
        const newQuiz = {
            title,
            link,
            questions: parseInt(questions),
            status,
            date: new Date().toISOString()
        };
        await firestore.collection(QUIZZES_COLLECTION).add(newQuiz);
    }

    async updateQuiz(id, title, link, questions, status) {
        await firestore.collection(QUIZZES_COLLECTION).doc(id).update({
            title,
            link,
            questions: parseInt(questions),
            status
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
            // Note: Cannot update Auth password from here for other users
            // only Firestore data
            const updateData = { ...data };
            delete updateData.password; // Remove password if present as we can't update it directly here

            await firestore.collection(USERS_COLLECTION).doc(id).update(updateData);

            // Return updated user data (mocked or fetched)
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

    async updateUserProgress(userId, score, quizId, answers) {
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
