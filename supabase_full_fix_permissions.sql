



DROP POLICY IF EXISTS "Only admins can delete quizzes" ON quizzes;
CREATE POLICY "Admins can delete quizzes"
    ON quizzes FOR DELETE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );


DROP POLICY IF EXISTS "Admins can delete attempts" ON quiz_attempts;
CREATE POLICY "Admins can delete attempts"
    ON quiz_attempts FOR DELETE
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );


DROP POLICY IF EXISTS "Only admins can manage questions" ON quiz_questions;

CREATE POLICY "Admins can manage questions"
    ON quiz_questions FOR ALL
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );


UPDATE profiles
SET role = 'admin'
WHERE username = 'admin';


ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;


GRANT ALL ON quizzes TO authenticated;
GRANT ALL ON quiz_attempts TO authenticated;
GRANT ALL ON quiz_questions TO authenticated;
