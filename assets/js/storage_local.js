/**
 * storage.js
 * Wrapper for LocalStorage handling to simulate a database.
 * Supports: Users table, Content table
 */

const DB_KEY = 'dkotoba_db';

const defaultData = {
    users: [
        { id: 1, username: 'admin', role: 'admin', password: '123' },
        { id: 2, username: 'user', role: 'user', password: '123' }
    ],
    content: [
        { id: 1, title: 'Halo Dunia', link: 'https://example.com', status: 'publish', date: '2026-01-28' },
        { id: 2, title: 'Tips Belajar', link: 'https://example.com/tips', status: 'draft', date: '2026-01-28' }
    ],
    quizzes: [
        { id: 1, title: 'Latihan Hiragana Dasar 1', link: 'https://quizizz.com/join/quiz/hiragana-1', questions: 10, status: 'publish', date: '2026-01-28' },
        { id: 2, title: 'Kuis Katakana Harian', link: 'https://quizizz.com/join/quiz/katakana-daily', questions: 15, status: 'publish', date: '2026-01-28' }
    ],
    currentUser: null
};

class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(DB_KEY)) {
            localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
            console.log('Database initialized.');
        }
    }

    getDB() {
        return JSON.parse(localStorage.getItem(DB_KEY));
    }

    saveDB(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }

    // --- Auth ---
    login(username, password) {
        const db = this.getDB();
        const user = db.users.find(u => u.username === username && u.password === password);
        if (user) {
            db.currentUser = user;
            this.saveDB(db);
            return { success: true, user };
        }
        return { success: false, message: 'Identitas salah atau akun tidak ditemukan.' };
    }

    register(username, password, fullName = '') {
        const db = this.getDB();
        if (db.users.find(u => u.username === username)) {
            return { success: false, message: 'Username sudah digunakan.' };
        }
        const newUser = {
            id: Date.now(),
            username,
            password,
            fullName,
            role: 'user' // Default role
        };
        db.users.push(newUser);
        this.saveDB(db);
        return { success: true, user: newUser };
    }

    logout() {
        const db = this.getDB();
        db.currentUser = null;
        this.saveDB(db);
    }

    getCurrentUser() {
        const db = this.getDB();
        return db.currentUser;
    }

    // --- Content CRUD ---
    getContents() {
        return this.getDB().content;
    }

    addContent(title, body) {
        const db = this.getDB();
        const newId = db.content.length > 0 ? Math.max(...db.content.map(c => c.id)) + 1 : 1;
        const newItem = {
            id: newId,
            title,
            body,
            date: new Date().toISOString().split('T')[0]
        };
        db.content.unshift(newItem); // Add to top
        this.saveDB(db);
        return newItem;
    }

    updateContent(id, title, body) {
        const db = this.getDB();
        const index = db.content.findIndex(c => c.id === id);
        if (index !== -1) {
            db.content[index] = { ...db.content[index], title, body };
            this.saveDB(db);
            return true;
        }
        return false;
    }

    deleteContent(id) {
        const db = this.getDB();
        db.content = db.content.filter(c => c.id !== id);
        this.saveDB(db);
    }



    // --- Quiz CRUD ---
    getQuizzes() {
        return this.getDB().quizzes || [];
    }

    addQuiz(title, link, questions, status) {
        const db = this.getDB();
        // Ensure quizzes array exists
        if (!db.quizzes) db.quizzes = [];

        const newId = db.quizzes.length > 0 ? Math.max(...db.quizzes.map(q => q.id)) + 1 : 1;
        const newItem = {
            id: newId,
            title,
            link,
            questions: parseInt(questions) || 0,
            status,
            date: new Date().toISOString().split('T')[0]
        };
        db.quizzes.unshift(newItem);
        this.saveDB(db);
        return newItem;
    }

    deleteQuiz(id) {
        const db = this.getDB();
        if (!db.quizzes) return;
        db.quizzes = db.quizzes.filter(q => q.id !== id);
        this.saveDB(db);
    }

    updateQuiz(id, title, link, questions, status) {
        const db = this.getDB();
        if (!db.quizzes) return false;

        const index = db.quizzes.findIndex(q => q.id === id);
        if (index !== -1) {
            db.quizzes[index] = {
                ...db.quizzes[index],
                title,
                link,
                questions: parseInt(questions) || 0,
                status
            };
            this.saveDB(db);
            return true;
        }
        return false;
    }

    // --- User Progress ---
    updateUserProgress(userId, score, quizId, answers) {
        const db = this.getDB();
        const userIndex = db.users.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            const user = db.users[userIndex];

            // Initialize stats if not present
            if (!user.score) user.score = 0;
            if (!user.completedQuizzes) user.completedQuizzes = 0;
            if (!user.history) user.history = [];

            // Check if already completed this quiz to avoid duplicate counting of completion count
            // (Simpler logic: just add for now, or check history)
            const alreadyDone = user.history.includes(quizId);

            if (!user.quizHistoryDetails) user.quizHistoryDetails = {};

            if (!alreadyDone) {
                user.score += score;
                user.completedQuizzes += 1;
                user.history.push(quizId);
            }

            // Always update/ovewrite the latest attempt details for review
            user.quizHistoryDetails[quizId] = {
                score: score,
                answers: answers,
                date: new Date().toISOString()
            };

            // Update user in DB
            db.users[userIndex] = user;

            // If this is the current user, update session too
            if (db.currentUser && db.currentUser.id === userId) {
                db.currentUser = user;
            }

            this.saveDB(db);
            return true;
        }
        return false;
    }

    // --- User Management ---
    deleteUser(id) {
        const db = this.getDB();
        // Prevent deleting self (simple check)
        if (db.currentUser && db.currentUser.id === id) {
            return false;
        }
        db.users = db.users.filter(u => u.id !== id);
        this.saveDB(db);
        return true;
    }

    updateUser(id, data) {
        const db = this.getDB();
        const index = db.users.findIndex(u => u.id === id);
        if (index !== -1) {
            // If username is changing, check for uniqueness
            if (data.username && data.username !== db.users[index].username) {
                if (db.users.find(u => u.username === data.username)) {
                    return { success: false, message: 'Username sudah digunakan.' };
                }
            }

            db.users[index] = { ...db.users[index], ...data };

            // If updating current user, update session
            if (db.currentUser && db.currentUser.id === id) {
                db.currentUser = db.users[index];
            }

            this.saveDB(db);
            return { success: true, user: db.users[index] };
        }
        return { success: false, message: 'User tidak ditemukan.' };
    }
}

const db = new StorageManager();
