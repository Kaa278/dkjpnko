



GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;


GRANT SELECT ON quiz_attempts TO anon;
GRANT SELECT ON quiz_attempts TO authenticated;
GRANT ALL ON quiz_attempts TO authenticated;


GRANT SELECT ON profiles TO anon;
GRANT SELECT ON profiles TO authenticated;

GRANT SELECT ON quizzes TO anon;
GRANT SELECT ON quizzes TO authenticated;

GRANT SELECT ON quiz_questions TO anon;
GRANT SELECT ON quiz_questions TO authenticated;


SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'quiz_attempts'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;


SELECT COUNT(*) FROM quiz_attempts;
