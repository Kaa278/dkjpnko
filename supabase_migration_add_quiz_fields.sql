



DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quizzes' AND column_name = 'level'
    ) THEN
        ALTER TABLE quizzes ADD COLUMN level TEXT DEFAULT 'N5';
        ALTER TABLE quizzes ADD CONSTRAINT quizzes_level_check 
            CHECK (level IN ('N5', 'N4', 'N3', 'N2', 'N1'));
    END IF;
END $$;


DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quizzes' AND column_name = 'deadline_at'
    ) THEN
        ALTER TABLE quizzes ADD COLUMN deadline_at TIMESTAMPTZ;
    END IF;
END $$;


DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quizzes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE quizzes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE INDEX IF NOT EXISTS idx_quizzes_level ON quizzes(level);
CREATE INDEX IF NOT EXISTS idx_quizzes_deadline_at ON quizzes(deadline_at);
