
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;


NOTIFY pgrst, 'reload schema';
