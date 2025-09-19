-- Update specific user to admin role
-- Make sure this email matches your registered account
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'thanglqhe171901@fpt.edu.vn';

-- Verify the update worked
SELECT id, email, role, created_at 
FROM public.profiles 
WHERE email = 'thanglqhe171901@fpt.edu.vn';
