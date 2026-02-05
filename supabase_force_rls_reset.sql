



ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Admins can delete attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "admins_read_all_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "users_read_own_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "users_insert_own_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "admins_full_access_attempts" ON quiz_attempts;


ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;


SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'quiz_attempts';


SELECT COUNT(*) as total_attempts FROM quiz_attempts;
SELECT * FROM quiz_attempts LIMIT 1;



