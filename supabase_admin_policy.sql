



ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Admins can view all attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;


CREATE POLICY "Admins can view all attempts"
ON quiz_attempts FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);


CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);


DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
CREATE POLICY "Users can view own attempts"
ON quiz_attempts FOR SELECT
USING (
  auth.uid() = user_id
);


DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (
  auth.uid() = id
);






DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true); 



