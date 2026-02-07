
const SUPABASE_URL = "https://bcarkhhvoesexuufcezg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXJraGh2b2VzZXh1dWZjZXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjkzOTYsImV4cCI6MjA4NTUwNTM5Nn0.5GpcQFVIPW88WdY88gnz6UWani4bfBcp9hSQ1oEZ0sU";
let supabaseClient = null;

const questions = [
    { q: "いぬ", a: "Anjing", opts: ["Kucing", "Anjing", "Burung", "Kuda"] },
    { q: "ねこ", a: "Kucing", opts: ["Kucing", "Sapi", "Ayam", "Kelinci"] },
    { q: "りんご", a: "Apel", opts: ["Jeruk", "Apel", "Pisang", "Anggur"] },
    { q: "ほん", a: "Buku", opts: ["Buku", "Pensil", "Tas", "Meja"] },
    { q: "がっこう", a: "Sekolah", opts: ["Taman", "Rumah", "Sekolah", "Kantor"] },
    { q: "せんせい", a: "Guru", opts: ["Murid", "Guru", "Dokter", "Polisi"] },
    { q: "たべる", a: "Makan", opts: ["Minum", "Makan", "Tidur", "Lari"] },
    { q: "みる", a: "Melihat", opts: ["Mendengar", "Berbicara", "Melihat", "Menulis"] },
    { q: "わたし", a: "Saya", opts: ["Kamu", "Dia", "Mereka", "Saya"] },
    { q: "ありがとう", a: "Terima Kasih", opts: ["Halo", "Selamat Pagi", "Maaf", "Terima Kasih"] }
];


let currentQ = 0;
let score = 0;
let startTime = null;
let userAnswers = [];


const urlParams = new URLSearchParams(window.location.search);

let USER_ID = urlParams.get('uid');

const SERVER_QUIZ_ID = urlParams.get('qid') || "quiz-1770047284120";





let isRegisterParams = false;

window.onload = function () {
    console.log("Window loaded. Initializing...");


    if (window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase initialized.");
        } catch (e) {
            console.error("Supabase init error:", e);
            alert("Gagal memuat sistem database.");
        }
    } else {
        console.error("Supabase library not found!");
        alert("Gagal memuat library sistem. Coba refresh halaman.");
    }

    if (USER_ID) {

        document.getElementById('start-screen').style.display = 'block';
    } else {

        document.getElementById('auth-modal').style.display = 'block';
    }
};

window.toggleAuthMode = function () {
    isRegisterParams = !isRegisterParams;
    const title = document.getElementById('auth-title');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');
    const nameInput = document.getElementById('auth-fullname');

    if (isRegisterParams) {
        title.innerText = "Buat Akun Baru";
        switchText.innerText = "Sudah punya akun?";
        switchBtn.innerText = "Masuk";
        nameInput.style.display = "block";
    } else {
        title.innerText = "Login Siswa";
        switchText.innerText = "Belum punya akun?";
        switchBtn.innerText = "Daftar";
        nameInput.style.display = "none";
    }
};

window.handleAuth = async function () {
    const userIn = document.getElementById('auth-username').value.trim();
    const passIn = document.getElementById('auth-password').value;
    const nameIn = document.getElementById('auth-fullname').value.trim();
    const msg = document.getElementById('auth-msg');
    const btn = document.getElementById('auth-btn');

    msg.innerText = "";
    if (!userIn || !passIn) {
        msg.innerText = "Mohon isi username dan password.";
        return;
    }

    // Set Loading State
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Memproses...';


    const email = `${userIn.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;

    try {
        if (isRegisterParams) {

            if (!nameIn) {
                msg.innerText = "Mohon isi nama lengkap.";
                resetBtn();
                return;
            }
            if (passIn.length < 6) {
                msg.innerText = "Password minimal 6 karakter.";
                resetBtn();
                return;
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: passIn,
                options: {
                    data: {
                        username: userIn,
                        full_name: nameIn,
                        role: 'user',
                        password: passIn
                    }
                }
            });

            if (error) throw error;
            if (data.user) {

                msg.style.color = "green";
                msg.innerText = "Berhasil! Silakan masuk.";
                setTimeout(() => {
                    window.toggleAuthMode();
                    resetBtn();
                }, 1000);
            }

        } else {

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: passIn
            });

            if (error) throw error;

            if (data.user) {
                // Success case
                msg.style.color = "green";
                msg.innerText = "Akun berhasil masuk! Mengalihkan...";

                setTimeout(() => {
                    USER_ID = data.user.id;
                    document.getElementById('auth-modal').style.display = "none";
                    document.getElementById('start-screen').style.display = "block";
                    resetBtn();
                }, 1500);
            }
        }
    } catch (err) {
        console.error(err);
        msg.style.color = "red";
        // Customize error message as requested
        msg.innerText = "Akun belum ada, silakan buat akun terlebih dahulu.";

        // Auto-switch to register if currently in login mode
        if (!isRegisterParams) {
            setTimeout(() => {
                window.toggleAuthMode();
                resetBtn();
            }, 1500);
        } else {
            resetBtn();
        }
    }

    function resetBtn() {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

window.startQuiz = startQuiz;

function startQuiz() {
    console.log("Starting Quiz...");
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-interface').style.display = 'block';

    currentQ = 0;
    score = 0;
    userAnswers = [];
    startTime = new Date();

    loadQuestion();
    startTimer();
}

let selectedAnswer = null;

function loadQuestion() {
    if (currentQ >= questions.length) {
        finishQuiz();
        return;
    }

    selectedAnswer = null; // Reset selection

    const data = questions[currentQ];
    document.getElementById('q-counter').innerText = `${currentQ + 1} / ${questions.length}`;
    document.getElementById('progress-fill').style.width = `${((currentQ) / questions.length) * 100}%`;

    document.getElementById('question-text').innerText = data.q;

    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';


    const opts = [...data.opts].sort(() => Math.random() - 0.5);

    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(btn, opt);
        grid.appendChild(btn);
    });

    // Reset and Hide Next Button initially
    const nextBtnContainer = document.getElementById('next-btn-container');
    const nextBtn = nextBtnContainer.querySelector('button');
    nextBtn.disabled = true; // Disable until selection
    nextBtn.innerText = (currentQ === questions.length - 1) ? "Selesai ✨" : "Lanjut ➡";

    // Make sure container is visible but button disabled
    nextBtnContainer.style.display = 'block';
}

function selectOption(btn, opt) {
    // Visual update
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Store selection
    selectedAnswer = opt;

    // Enable Next Button
    const nextBtn = document.querySelector('#next-btn-container button');
    nextBtn.disabled = false;
}

window.nextQuestion = function () {
    if (!selectedAnswer) return; // Should be disabled anyway

    const currentData = questions[currentQ];
    const isCorrect = selectedAnswer === currentData.a;

    if (isCorrect) score++;

    userAnswers.push({
        question: currentData.q,
        correct: currentData.a,
        selected: selectedAnswer,
        isCorrect: isCorrect
    });

    document.getElementById('next-btn-container').style.display = 'none'; // Hide briefly during transition if needed, or keep for transition
    currentQ++;
    loadQuestion();
};



function startTimer() {
    const timerEl = document.getElementById('timer');
    setInterval(() => {
        if (!startTime) return;
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        const m = Math.floor(diff / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        timerEl.innerText = `${m}:${s}`;
    }, 1000);
}

async function finishQuiz() {
    document.getElementById('quiz-interface').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';


    const finalScore = Math.round((score / questions.length) * 100);
    const durationSeconds = Math.floor((new Date() - startTime) / 1000);

    document.getElementById('final-score').innerText = finalScore;


    const resultText = document.getElementById('result-text');


    if (!USER_ID) {
        resultText.innerText = "Mode Preview (Skor tidak disimpan)";
        resultText.style.color = "#f59e0b";
        return;
    }

    resultText.innerText = "Memproses skor...";

    try {
        // 1. Check if already attempted
        const { data: existing, error: checkError } = await supabaseClient
            .from('quiz_attempts')
            .select('id')
            .eq('user_id', USER_ID)
            .eq('quiz_id', SERVER_QUIZ_ID);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
            resultText.innerText = "Skor tidak disimpan (Anda sudah pernah mengerjakan).";
            resultText.style.color = "#f59e0b";
            return;
        }

        // 2. Insert if new
        resultText.innerText = "Menyimpan ke Dashboard...";
        const { error } = await supabaseClient
            .from('quiz_attempts')
            .insert([
                {
                    user_id: USER_ID,
                    quiz_id: SERVER_QUIZ_ID,
                    score: finalScore,
                    duration_seconds: durationSeconds,
                    answers: userAnswers,
                    completed_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        resultText.innerText = "Berhasil tersimpan! Anda boleh menutup halaman ini.";
        resultText.style.color = "#16a34a";

    } catch (err) {
        console.error(err);
        resultText.innerText = "Gagal memproses data. Cek koneksi.";
        resultText.style.color = "#dc2626";
    }
}


window.showReview = function () {
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('review-screen').style.display = 'block';

    const list = document.getElementById('review-list');
    list.innerHTML = "";

    userAnswers.forEach((ans, idx) => {
        const item = document.createElement('div');
        item.className = 'review-item';

        const statusColor = ans.isCorrect ? "#16a34a" : "#dc2626";
        const statusText = ans.isCorrect ? "Benar" : "Salah";

        item.innerHTML = `
            <div class="review-header">
                <span style="color:#64748b;">No. ${idx + 1}</span>
                <span style="color:${statusColor}">${statusText}</span>
            </div>
            <div class="review-question">${ans.question}</div>
            <div class="review-answer">
                Jawaban Anda: <span style="font-weight:bold; color:${ans.isCorrect ? '#16a34a' : '#dc2626'}">${ans.selected}</span>
                ${!ans.isCorrect ? `<br>Jawaban Benar: <span style="font-weight:bold; color:#16a34a">${ans.correct}</span>` : ''}
            </div>
        `;
        list.appendChild(item);
    });
};
