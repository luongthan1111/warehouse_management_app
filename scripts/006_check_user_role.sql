-- Check the role of specific user
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'thanglqhe171901@fpt.edu.vn';

-- Also check if there are any users with admin role
SELECT 
    email,
    role,
    created_at
FROM profiles 
WHERE role = 'admin';
