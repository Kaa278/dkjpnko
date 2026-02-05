


DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quizzes' AND column_name = 'external_link'
    ) THEN
        ALTER TABLE quizzes ADD COLUMN external_link TEXT;
    END IF;
END $$;
