


const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const urlParams = new URLSearchParams(window.location.search);
const USER_ID = urlParams.get('uid');
const QUIZ_ID = urlParams.get('qid');
const USER_NAME = urlParams.get('uname'); 

console.log("Tracking for:", USER_NAME, "Quiz ID:", QUIZ_ID);


async function submitScoreToSupabase(finalScore, durationSeconds) {
    if (!USER_ID || !QUIZ_ID) {
        console.warn("Tracking skipped: No User ID or Quiz ID found in URL.");
        alert("Mode Preview: Skor tidak akan tersimpan (Buka dari Dashboard untuk tracking).");
        return;
    }

    try {
        const { data, error } = await supabase
            .from('quiz_attempts')
            .insert([
                {
                    user_id: USER_ID,
                    quiz_id: QUIZ_ID,
                    score: finalScore,
                    duration_seconds: durationSeconds,
                    completed_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        console.log("Score saved successfully!", data);
        alert("Selamat! Progres Anda telah tersimpan ke Dashboard.");

        
        
    } catch (err) {
        console.error("Error saving score:", err);
        alert("Gagal menyimpan skor. Cek koneksi internet Anda.");
    }
}
