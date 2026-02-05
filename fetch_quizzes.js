const { createClient } = require('@supabase/supabase-js');


const SUPABASE_URL = "https://bcarkhhvoesexuufcezg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXJraGh2b2VzZXh1dWZjZXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjkzOTYsImV4cCI6MjA4NTUwNTM5Nn0.5GpcQFVIPW88WdY88gnz6UWani4bfBcp9hSQ1oEZ0sU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const { data, error } = await supabase.from('quizzes').select('id, title');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

main();
