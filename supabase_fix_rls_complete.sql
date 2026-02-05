



DROP POLICY IF EXISTS "Everyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

DROP POLICY IF EXISTS "Admins can view all attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON quiz_attempts;

DROP POLICY IF EXISTS "Quizzes are viewable by everyone" ON quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;

DROP POLICY IF EXISTS "Questions are viewable by everyone" ON quiz_questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON quiz_questions;


ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_can_read_profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);


CREATE POLICY "admins_full_access_profiles"
ON profiles FOR ALL
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


CREATE POLICY "admins_read_all_attempts"
ON quiz_attempts FOR SELECT
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "users_read_own_attempts"
ON quiz_attempts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_attempts"
ON quiz_attempts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_full_access_attempts"
ON quiz_attempts FOR ALL
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


CREATE POLICY "everyone_read_quizzes"
ON quizzes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admins_full_access_quizzes"
ON quizzes FOR ALL
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


CREATE POLICY "everyone_read_questions"
ON quiz_questions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admins_full_access_questions"
ON quiz_questions FOR ALL
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');


UPDATE profiles
SET role = 'admin'
WHERE username = 'admin' OR username = 'Administrator';


GRANT ALL ON profiles TO authenticated;
GRANT ALL ON quiz_attempts TO authenticated;
GRANT ALL ON quizzes TO authenticated;
GRANT ALL ON quiz_questions TO authenticated;


