



UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();





SELECT id, username, full_name, role FROM profiles WHERE id = auth.uid();
