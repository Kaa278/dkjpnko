


const firebaseConfig = {
    apiKey: "AIzaSyAO-CTf7DVqkD-V-_mtL7e9hP5QNf7vkQM",
    authDomain: "dkotobakuis-c69a1.firebaseapp.com",
    projectId: "dkotobakuis-c69a1",
    storageBucket: "dkotobakuis-c69a1.firebasestorage.app",
    messagingSenderId: "935131530677",
    appId: "1:935131530677:web:d4f77248f542a2f39745fc"
};


const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();


const USERS_COLLECTION = 'users';
const CONTENT_COLLECTION = 'content';
const QUIZZES_COLLECTION = 'quizzes';


const getEmail = (username) => `${username.toLowerCase()}@dkotoba.app`;

window.dbRef = null; 

class StorageManager {
    constructor() {
        this.currentUser = null;
        window.dbRef = this;
    }

    
    async getCurrentUser() {
        
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
        
        return {
            users: [], 
            content: [],
            quizzes: [],
            currentUser: this.currentUser
        };
    }

    
    async login(username, password) {
        try {
            const inputPassword = (password || '').trim();
            
            const userDoc = await this.getUserByUsername(username);

            if (!userDoc) {
                return { success: false, message: 'Username tidak ditemukan.' };
            }

            
            const isAdmin = userDoc.username === 'admin' && (userDoc.role || '').toLowerCase() === 'admin';

            if (isAdmin) {
                const email = getEmail(username);
                const userCredential = await auth.signInWithEmailAndPassword(email, inputPassword);
                const uid = userCredential.user.uid;
                this.currentUser = { id: uid, ...userDoc };
                return { success: true, user: this.currentUser };
            }

            
            
            if (!userDoc.password) {
                return {
                    success: false,
                    needActivation: true,
                    userId: userDoc.id
                };
            }

            
            if (userDoc.password.trim() !== inputPassword) {
                return { success: false, message: 'Password salah.' };
            }

            
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
            
            const existing = await this.getUserByUsername(username);
            if (existing) {
                return { success: false, message: 'Username sudah digunakan.' };
            }

            
            const newUser = {
                username: username,
                fullName: fullName,
                password: (password || '').trim(),
                role: 'user', 
                score: 0,
                completedQuizzes: 0,
                history: [],
                quizHistoryDetails: {},
                createdAt: new Date().toISOString()
            };

            const docRef = await firestore.collection(USERS_COLLECTION).add(newUser);
            const uid = docRef.id;

            
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
            
            const user = await this.getUserByUsername(username);
            if (user) {
                return 'existing';
            }

            
            
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
            const password = 'admin'; 
            
            
            
            
            
            
            
            

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

    

    async deleteUser(id) {
        await firestore.collection(USERS_COLLECTION).doc(id).delete();
    }

    async updateUser(id, data) {
        try {
            
            const updateData = {
                fullName: data.fullName ?? '',
                username: (data.username || '').trim()
            };

            
            const role = (data.role || '').toLowerCase();
            if (role === 'admin' || role === 'user') {
                updateData.role = role;
            }

            
            if (typeof data.password === 'string' && data.password.trim() !== '') {
                updateData.password = data.password.trim();
            }

            await firestore.collection(USERS_COLLECTION).doc(id).update(updateData);

            
            return { success: true, user: { id, ...updateData }, message: "User updated" };
        } catch (e) {
            console.error(e);
            return { success: false, message: e.message };
        }
    }

    

    
    async getAllUsers() {
        const snapshot = await firestore.collection(USERS_COLLECTION).where('role', '==', 'user').get(); 
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async updateUserProgress(userId, score, quizId, answers, duration = null) {
        const userRef = firestore.collection(USERS_COLLECTION).doc(userId);

        
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


window.dbRef = new StorageManager();
