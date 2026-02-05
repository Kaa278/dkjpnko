




INSERT INTO public.profiles (id, username, full_name, role)
SELECT 
    id, 
   
    COALESCE(raw_user_meta_data->>'username', email, 'user_' || substr(id::text, 1, 8)),
    COALESCE(raw_user_meta_data->>'full_name', 'System Admin'),
    'admin'
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET role = 'admin';


SELECT * FROM profiles;
