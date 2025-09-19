-- View to enrich bookings with profile data without relying on implicit relationships
CREATE OR REPLACE VIEW public.view_bookings_with_profiles AS
SELECT 
  b.*,
  p.full_name AS profile_full_name,
  p.email     AS profile_email,
  p.company   AS profile_company
FROM public.bookings b
LEFT JOIN public.profiles p
  ON p.id = b.user_id;