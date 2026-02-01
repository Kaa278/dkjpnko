/**
 * logic.js for Soal2
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
        quizId: 'soal2',
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

            if (qId) this.quizId = qId;

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

        questions: [
            // A. Kosakata (10 soal)
            { type: 'mc', text: 'ねこ', romaji: 'neko', options: ['anjing', 'kucing', 'burung', 'ikan'], answer: 'kucing' },
            { type: 'mc', text: 'いぬ', romaji: 'inu', options: ['kucing', 'sapi', 'anjing', 'kuda'], answer: 'anjing' },
            { type: 'mc', text: 'みず', romaji: 'mizu', options: ['teh', 'air', 'susu', 'kopi'], answer: 'air' },
            { type: 'mc', text: 'ほん', romaji: 'hon', options: ['meja', 'buku', 'tas', 'kursi'], answer: 'buku' },
            { type: 'mc', text: 'がくせい', romaji: 'gakusei', options: ['guru', 'siswa', 'dokter', 'polisi'], answer: 'siswa' },
            { type: 'mc', text: 'せんせい', romaji: 'sensei', options: ['siswa', 'teman', 'guru', 'ayah'], answer: 'guru' },
            { type: 'mc', text: 'おおきい', romaji: 'ookii', options: ['kecil', 'besar', 'tinggi', 'panjang'], answer: 'besar' },
            { type: 'mc', text: 'ちいさい', romaji: 'chiisai', options: ['besar', 'kecil', 'tinggi', 'rendah'], answer: 'kecil' },
            { type: 'mc', text: 'あかい', romaji: 'akai', options: ['biru', 'hitam', 'merah', 'putih'], answer: 'merah' },
            { type: 'mc', text: 'しろい', romaji: 'shiroi', options: ['hitam', 'putih', 'merah', 'kuning'], answer: 'putih' },

            // B. Pilihan Ganda (10 soal)
            { type: 'mc', text: 'わたしは がくせい です。', romaji: 'watashi wa gakusei desu.', options: ['Saya seorang guru', 'Saya seorang siswa', 'Saya pergi ke sekolah', 'Saya belajar bahasa Jepang'], answer: 'Saya seorang siswa' },
            { type: 'mc', text: 'これは ほん です。', romaji: 'kore wa hon desu.', options: ['Ini meja', 'Ini buku', 'Itu tas', 'Itu pensil'], answer: 'Ini buku' },
            { type: 'mc', text: 'ねこが います。', romaji: 'neko ga imasu.', options: ['Ada seekor kucing', 'Ada seekor anjing', 'Saya punya kucing', 'Kucing itu besar'], answer: 'Ada seekor kucing' },
            { type: 'mc', text: 'みずを のみます。', romaji: 'mizu o nomimasu.', options: ['Minum air', 'Makan nasi', 'Membaca buku', 'Pergi ke rumah'], answer: 'Minum air' },
            { type: 'mc', text: 'パンを たべます。', romaji: 'pan o tabemasu.', options: ['Minum roti', 'Membeli roti', 'Makan roti', 'Melihat roti'], answer: 'Makan roti' },
            { type: 'mc', text: 'いぬは ちいさい です。', romaji: 'inu wa chiisai desu.', options: ['Anjing itu besar', 'Anjing itu kecil', 'Anjing itu putih', 'Anjing itu lucu'], answer: 'Anjing itu kecil' },
            { type: 'mc', text: 'せんせいは きます。', romaji: 'sensei wa kimasu.', options: ['Guru pergi', 'Guru datang', 'Guru makan', 'Guru tidur'], answer: 'Guru datang' },
            { type: 'mc', text: 'きょう は あめ です。', romaji: 'kyou wa ame desu.', options: ['Hari ini cerah', 'Hari ini hujan', 'Hari ini panas', 'Hari ini dingin'], answer: 'Hari ini hujan' },
            { type: 'mc', text: 'わたしは うちへ いきます。', romaji: 'watashi wa uchi e ikimasu.', options: ['Saya datang ke rumah', 'Saya tidur di rumah', 'Saya pergi ke rumah', 'Saya makan di rumah'], answer: 'Saya pergi ke rumah' },
            { type: 'mc', text: 'そらは あおい です。', romaji: 'sora wa aoi desu.', options: ['Langit itu merah', 'Langit itu hitam', 'Langit itu biru', 'Langit itu putih'], answer: 'Langit itu biru' },

            // C. Esai (10 soal)
            { type: 'essay', text: 'わたしは がくせい です。', romaji: 'watashi wa gakusei desu', answer: 'Saya adalah seorang siswa.' },
            { type: 'essay', text: 'これは えんぴつ です。', romaji: 'kore wa enpitsu desu', answer: 'Ini adalah sebuah pensil.' },
            { type: 'essay', text: 'ねこが います。', romaji: 'neko ga imasu', answer: 'Ada seekor kucing.' },
            { type: 'essay', text: 'みずを のみます。', romaji: 'mizu o nomimasu', answer: 'Minum air.' },
            { type: 'essay', text: 'パンを たべます。', romaji: 'pan o tabemasu', answer: 'Makan roti.' },
            { type: 'essay', text: 'いぬは おおきい です。', romaji: 'inu wa ookii desu', answer: 'Anjing itu besar.' },
            { type: 'essay', text: 'せんせいは がっこうへ いきます。', romaji: 'sensei wa gakkou e ikimasu', answer: 'Guru pergi ke sekolah.' },
            { type: 'essay', text: 'きょう は はれ です。', romaji: 'kyou wa hare desu', answer: 'Hari ini cerah.' },
            { type: 'essay', text: 'わたしは にほんごを べんきょうします。', romaji: 'watashi wa nihongo o benkyou shimasu', answer: 'Saya belajar bahasa Jepang.' },
            { type: 'essay', text: 'そらは きれい です。', romaji: 'sora wa kirei desu', answer: 'Langit itu indah.' }
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
                if (this.essayAnswer.toLowerCase().trim() === q.answer.toLowerCase() ||
                    this.essayAnswer.toLowerCase().trim() === q.answer.toLowerCase().replace('.', '').trim()) isCorrect = true;
            }
            this.userAnswers.push(userAnswer);
            if (isCorrect) {
                this.correctCount++;
                this.score += 100 / this.totalQuestions;
            }
            this.selectedAnswer = null;
            this.essayAnswer = '';
            if (this.currentIndex < this.totalQuestions - 1) this.currentIndex++;
            else this.finishQuiz();
        },

        isCorrect(index) {
            const q = this.questions[index];
            const userAns = this.userAnswers[index];
            if (!userAns) return false;
            if (q.type === 'mc') return userAns === q.answer;
            return userAns.toLowerCase().trim() === q.answer.toLowerCase() ||
                userAns.toLowerCase().trim() === q.answer.toLowerCase().replace('.', '').trim();
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
