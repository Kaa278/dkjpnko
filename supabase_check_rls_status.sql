


SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'quiz_attempts', 'quizzes', 'quiz_questions')
ORDER BY tablename;





SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'quiz_attempts', 'quizzes', 'quiz_questions')
ORDER BY tablename, policyname;
