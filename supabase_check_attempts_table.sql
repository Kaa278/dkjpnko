


SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'quiz_attempts'
ORDER BY ordinal_position;


SELECT * FROM quiz_attempts LIMIT 5;
