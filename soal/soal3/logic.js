/**
 * logic.js for Soal3
 * Contains both StorageManager (Firebase) and QuizApp logic
 */

(function () {
    const firebaseConfig = {
        apiKey: "AIzaSyAO-CTf7DVqkD-V-_mtL7e9hP5QNf7vkQM",
        authDomain: "dkotobakuis-c69a1.firebaseapp.com",
        projectId: "dkotobakuis-c69a1",
        storageBucket: "dkotobakuis-c69a1.firebasestorage.app",
        messagingSenderId: "935131530677",
        appId: "1:935131530677:web:d4f77248f542a2f39745fc"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const firestore = firebase.firestore();
    const USERS_COLLECTION = 'users';

    const getEmail = (username) => `${username.toLowerCase()}@dkotoba.app`;

    class StorageManager {
        constructor() {
            this.currentUser = null;
            window.dbRef = this;
        }

        async getCurrentUser() {
            return new Promise((resolve) => {
                const unsubscribe = auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        const docRef = firestore.collection(USERS_COLLECTION).doc(user.uid);
                        try {
                            const doc = await docRef.get();
                            if (doc.exists) {
                                this.currentUser = { id: user.uid, ...doc.data() };
                                resolve(this.currentUser);
                            } else {
                                resolve(null);
                            }
                        } catch (e) {
                            console.error("Firestore error:", e);
                            resolve(null);
                        }
                    } else {
                        this.currentUser = null;
                        resolve(null);
                    }
                    unsubscribe();
                });
            });
        }

        async login(username, password) {
            try {
                const email = getEmail(username);
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const uid = userCredential.user.uid;
                const doc = await firestore.collection(USERS_COLLECTION).doc(uid).get();
                if (doc.exists) {
                    this.currentUser = { id: uid, ...doc.data() };
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
                const email = getEmail(username);
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const uid = userCredential.user.uid;

                const newUser = {
                    id: uid,
                    username: username,
                    fullName: fullName,
                    role: 'user',
                    score: 0,
                    completedQuizzes: 0,
                    history: [],
                    quizHistoryDetails: {},
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

        async checkUserStatus(username) {
            try {
                const user = await this.getUserByUsername(username);
                if (user) return 'existing';
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
                    return { id: doc.id, ...doc.data() };
                }
                return null;
            } catch (error) {
                console.error("Get User Error:", error);
                return null;
            }
        }

        async updateUserProgress(userId, score, quizId, answers, duration = null) {
            const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
            await firestore.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw "User does not exist!";

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

    window.StorageManager = StorageManager;
})();

function quizApp() {
    return {
        currentIndex: 0,
        score: 0,
        correctCount: 0,
        showResult: false,
        showReview: false,
        selectedAnswer: null,
        essayAnswer: '',
        userAnswers: [],
        db: null,
        currentUser: null,
        startTime: null,
        quizId: null,
        showAuthOverlay: false,
        authStep: 'username',
        authUsername: '',
        authPassword: '',
        authFullName: '',
        authStatus: null,
        authLoading: false,
        authError: '',
        durationDisplay: '',
        currentTimeDisplay: '0s',
        timerInterval: null,
        isClosed: false,
        deadlineTime: null,

        async init() {
            if (typeof window.StorageManager !== 'undefined') {
                this.db = new window.StorageManager();
                this.currentUser = await this.db.getCurrentUser();
                if (this.currentUser) this.startTimer();
            }

            const params = new URLSearchParams(window.location.search);
            const qId = params.get('quizId');
            const mode = params.get('mode');

            if (qId) {
                this.quizId = qId;
            } else {
                const parts = window.location.pathname.split('/');
                this.quizId = parts[parts.length - 2]; // contoh: "soal3"
            }

            await this.checkDeadline();

            if (!this.currentUser) {
                this.showAuthOverlay = true;
            } else {
                this.checkReviewMode(mode);
            }
        },

        async checkDeadline() {
            if (!this.db || !this.quizId) return;
            try {
                const doc = await firebase.firestore().collection('quizzes').doc(this.quizId).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.deadline) {
                        this.deadlineTime = data.deadline;
                        const now = new Date();
                        const deadline = new Date(data.deadline);
                        if (now > deadline) this.isClosed = true;
                    }
                }
            } catch (e) {
                console.error("Error checking deadline:", e);
            }
        },

        async checkUsername() {
            if (!this.authUsername) return;
            this.authLoading = true;
            this.authError = '';
            try {
                const status = await this.db.checkUserStatus(this.authUsername);
                this.authStatus = status;
                if (status === 'existing') {
                    const userData = await this.db.getUserByUsername(this.authUsername);
                    if (userData) {
                        this.currentUser = userData;
                        this.showAuthOverlay = false;
                        const params = new URLSearchParams(window.location.search);
                        this.checkReviewMode(params.get('mode'));
                    } else {
                        this.authError = "Gagal memuat data user.";
                    }
                } else {
                    this.authStep = 'password';
                }
            } catch (e) {
                this.authError = "Gagal mengecek username.";
            } finally {
                this.authLoading = false;
            }
        },

        async submitAuth() {
            if (!this.authPassword) return;
            if (this.authStatus === 'new' && !this.authFullName) {
                this.authError = "Nama Lengkap wajib diisi.";
                return;
            }
            this.authLoading = true;
            this.authError = '';
            try {
                let res;
                if (this.authStatus === 'new') {
                    res = await this.db.register(this.authUsername, this.authPassword, this.authFullName);
                } else {
                    res = await this.db.login(this.authUsername, this.authPassword);
                }
                if (res.success) {
                    this.currentUser = res.user;
                    this.startTimer();
                    this.showAuthOverlay = false;
                    const params = new URLSearchParams(window.location.search);
                    this.checkReviewMode(params.get('mode'));
                } else {
                    this.authError = res.message;
                }
            } catch (e) {
                this.authError = "Terjadi kesalahan.";
            } finally {
                this.authLoading = false;
            }
        },

        checkReviewMode(mode) {
            if (mode === 'review' && this.currentUser && this.currentUser.quizHistoryDetails) {
                const history = this.currentUser.quizHistoryDetails[this.quizId];
                if (history && history.answers) {
                    this.userAnswers = history.answers;
                    this.score = history.score;
                    this.correctCount = 0;
                    this.questions.forEach((q, idx) => {
                        if (this.isCorrect(idx)) this.correctCount++;
                    });
                    this.showResult = true;
                    this.showReview = true;
                }
            }
        },

        // ==========================
        // SOAL 3 (30 soal) - BEDA
        // ==========================
        questions: [
            // A. Kosakata (10 soal)
            { type: 'mc', text: 'やま', romaji: 'yama', options: ['laut', 'gunung', 'sungai', 'hutan'], answer: 'gunung' },
            { type: 'mc', text: 'かわ', romaji: 'kawa', options: ['sungai', 'danau', 'gunung', 'pantai'], answer: 'sungai' },
            { type: 'mc', text: 'うみ', romaji: 'umi', options: ['laut', 'hujan', 'angin', 'awan'], answer: 'laut' },
            { type: 'mc', text: 'はな', romaji: 'hana', options: ['bunga', 'daun', 'akar', 'pohon'], answer: 'bunga' },
            { type: 'mc', text: 'くるま', romaji: 'kuruma', options: ['sepeda', 'kereta', 'mobil', 'motor'], answer: 'mobil' },
            { type: 'mc', text: 'でんしゃ', romaji: 'densha', options: ['bus', 'kereta', 'mobil', 'pesawat'], answer: 'kereta' },
            { type: 'mc', text: 'たべもの', romaji: 'tabemono', options: ['minuman', 'makanan', 'pakaian', 'rumah'], answer: 'makanan' },
            { type: 'mc', text: 'のみもの', romaji: 'nomimono', options: ['makanan', 'minuman', 'uang', 'buku'], answer: 'minuman' },
            { type: 'mc', text: 'あたらしい', romaji: 'atarashii', options: ['baru', 'lama', 'panas', 'dingin'], answer: 'baru' },
            { type: 'mc', text: 'ふるい', romaji: 'furui', options: ['cepat', 'lama', 'baru', 'bagus'], answer: 'lama' },

            // B. Pilihan Ganda Kalimat (10 soal)
            { type: 'mc', text: 'わたしは みずを のみます。', romaji: 'watashi wa mizu o nomimasu.', options: ['Saya minum air', 'Saya makan air', 'Saya melihat air', 'Saya membeli air'], answer: 'Saya minum air' },
            { type: 'mc', text: 'これは くるま です。', romaji: 'kore wa kuruma desu.', options: ['Ini sepeda', 'Ini mobil', 'Itu motor', 'Itu bus'], answer: 'Ini mobil' },
            { type: 'mc', text: 'はなは きれい です。', romaji: 'hana wa kirei desu.', options: ['Bunga itu cantik', 'Bunga itu besar', 'Bunga itu murah', 'Bunga itu panas'], answer: 'Bunga itu cantik' },
            { type: 'mc', text: 'わたしは でんしゃで いきます。', romaji: 'watashi wa densha de ikimasu.', options: ['Saya pergi naik kereta', 'Saya tidur di kereta', 'Saya makan kereta', 'Saya beli kereta'], answer: 'Saya pergi naik kereta' },
            { type: 'mc', text: 'きょう は さむい です。', romaji: 'kyou wa samui desu.', options: ['Hari ini panas', 'Hari ini dingin', 'Hari ini hujan', 'Hari ini cerah'], answer: 'Hari ini dingin' },
            { type: 'mc', text: 'わたしは うみに いきます。', romaji: 'watashi wa umi ni ikimasu.', options: ['Saya pergi ke laut', 'Saya pergi ke gunung', 'Saya pergi ke rumah', 'Saya pergi ke sekolah'], answer: 'Saya pergi ke laut' },
            { type: 'mc', text: 'やまは たかい です。', romaji: 'yama wa takai desu.', options: ['Gunung itu rendah', 'Gunung itu tinggi', 'Gunung itu kecil', 'Gunung itu tua'], answer: 'Gunung itu tinggi' },
            { type: 'mc', text: 'これは あたらしい ほん です。', romaji: 'kore wa atarashii hon desu.', options: ['Ini buku baru', 'Ini buku lama', 'Itu buku baru', 'Itu buku kecil'], answer: 'Ini buku baru' },
            { type: 'mc', text: 'たべものを かいます。', romaji: 'tabemono o kaimasu.', options: ['Membeli makanan', 'Makan makanan', 'Minum makanan', 'Melihat makanan'], answer: 'Membeli makanan' },
            { type: 'mc', text: 'かわに さかなが います。', romaji: 'kawa ni sakana ga imasu.', options: ['Ada ikan di sungai', 'Ada burung di sungai', 'Ada ikan di laut', 'Ada ikan di gunung'], answer: 'Ada ikan di sungai' },

            // C. Esai (10 soal)
            { type: 'essay', text: 'わたしは たべものを たべます。', romaji: 'watashi wa tabemono o tabemasu', answer: 'Saya makan makanan.' },
            { type: 'essay', text: 'わたしは のみものを のみます。', romaji: 'watashi wa nomimono o nomimasu', answer: 'Saya minum minuman.' },
            { type: 'essay', text: 'これは でんしゃ です。', romaji: 'kore wa densha desu', answer: 'Ini adalah kereta.' },
            { type: 'essay', text: 'やまに いきます。', romaji: 'yama ni ikimasu', answer: 'Pergi ke gunung.' },
            { type: 'essay', text: 'うみに いきます。', romaji: 'umi ni ikimasu', answer: 'Pergi ke laut.' },
            { type: 'essay', text: 'はなを みます。', romaji: 'hana o mimasu', answer: 'Melihat bunga.' },
            { type: 'essay', text: 'わたしは くるまが あります。', romaji: 'watashi wa kuruma ga arimasu', answer: 'Saya punya mobil.' },
            { type: 'essay', text: 'きょう は あめ です。', romaji: 'kyou wa ame desu', answer: 'Hari ini hujan.' },
            { type: 'essay', text: 'かわは ながい です。', romaji: 'kawa wa nagai desu', answer: 'Sungai itu panjang.' },
            { type: 'essay', text: 'この ほんは ふるい です。', romaji: 'kono hon wa furui desu', answer: 'Buku ini lama.' }
        ],

        get totalQuestions() { return this.questions.length; },
        get canSubmit() {
            const q = this.questions[this.currentIndex];
            if (q.type === 'mc') return this.selectedAnswer !== null;
            if (q.type === 'essay') return this.essayAnswer.trim() !== '';
            return false;
        },

        selectAnswer(ans) { this.selectedAnswer = ans; },
        submitEssay() { if (this.essayAnswer.trim() !== '') this.submitAnswer(); },

        submitAnswer() {
            const q = this.questions[this.currentIndex];
            let isCorrect = false;
            let userAnswer = '';

            if (q.type === 'mc') {
                userAnswer = this.selectedAnswer;
                if (this.selectedAnswer === q.answer) isCorrect = true;
            } else {
                userAnswer = this.essayAnswer;

                const userNorm = this.essayAnswer.toLowerCase().trim();
                const ansNorm = q.answer.toLowerCase().trim();
                const ansNormNoDot = q.answer.toLowerCase().replace('.', '').trim();

                if (userNorm === ansNorm || userNorm === ansNormNoDot) isCorrect = true;
            }

            this.userAnswers.push(userAnswer);

            if (isCorrect) {
                this.correctCount++;
                this.score += 100 / this.totalQuestions;
            }

            this.selectedAnswer = null;
            this.essayAnswer = '';

            if (this.currentIndex < this.totalQuestions - 1) {
                this.currentIndex++;
            } else {
                this.finishQuiz();
            }
        },

        isCorrect(index) {
            const q = this.questions[index];
            const userAns = this.userAnswers[index];
            if (!userAns) return false;

            if (q.type === 'mc') return userAns === q.answer;

            const userNorm = userAns.toLowerCase().trim();
            const ansNorm = q.answer.toLowerCase().trim();
            const ansNormNoDot = q.answer.toLowerCase().replace('.', '').trim();

            return userNorm === ansNorm || userNorm === ansNormNoDot;
        },

        finishQuiz() {
            this.score = Math.round(this.score);
            this.showResult = true;
            this.stopTimer();

            const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
            this.durationDisplay = this.formatDuration(durationSeconds);

            if (this.db && this.currentUser && this.quizId) {
                this.db.updateUserProgress(this.currentUser.id, this.score, this.quizId, this.userAnswers, durationSeconds);
            }
        },

        startTimer() {
            this.stopTimer();
            this.startTime = Date.now();
            this.timerInterval = setInterval(() => {
                const seconds = Math.round((Date.now() - this.startTime) / 1000);
                this.currentTimeDisplay = this.formatDuration(seconds);
            }, 1000);
        },

        stopTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        },

        formatDuration(seconds) {
            if (seconds < 60) return seconds + ' detik';
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return m + 'm ' + s + 's';
        },

        formatDateSimple(isoString) {
            if (!isoString) return '-';
            try {
                const d = new Date(isoString);
                return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            } catch (e) { return '-'; }
        },

        resetQuiz() {
            this.currentIndex = 0;
            this.score = 0;
            this.correctCount = 0;
            this.showResult = false;
            this.showReview = false;
            this.selectedAnswer = null;
            this.durationDisplay = '';
            this.currentTimeDisplay = '0s';
            this.startTimer();
            this.essayAnswer = '';
            this.userAnswers = [];
        }
    }
}
