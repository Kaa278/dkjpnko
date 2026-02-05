



ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;



DO $$ 
BEGIN
    ALTER TABLE learning_materials DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'learning_materials table does not exist, skipping';
END $$;

DO $$ 
BEGIN
    ALTER TABLE material_categories DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'material_categories table does not exist, skipping';
END $$;


SELECT 'quiz_attempts' as table_name, COUNT(*) as total FROM quiz_attempts
UNION ALL
SELECT 'quizzes', COUNT(*) FROM quizzes
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;


