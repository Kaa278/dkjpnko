



ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;


SELECT id, username, full_name, role FROM profiles WHERE username ILIKE '%admin%';







