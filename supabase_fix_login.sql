



DROP POLICY IF EXISTS "authenticated_can_read_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_full_access_profiles" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "Everyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;


CREATE POLICY "users_read_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);


CREATE POLICY "admins_read_all_profiles"
ON profiles FOR SELECT
TO authenticated
USING (
 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);


CREATE POLICY "admins_manage_profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);


CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


