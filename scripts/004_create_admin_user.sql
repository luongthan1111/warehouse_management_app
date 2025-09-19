-- Create admin user script
-- After running this, you can login with: admin@warehouse.com / admin123

-- First, you need to create the user through Supabase Auth UI or API
-- Then run this script to update their role to admin

-- Update user role to admin (replace with actual user email)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'thanglqhe171901@fpt.edu.vn';

-- If you want to create multiple admin users, add them here:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin-email@domain.com';
