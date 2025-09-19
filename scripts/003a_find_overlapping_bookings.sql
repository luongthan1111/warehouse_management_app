-- Detect overlapping bookings that would block the exclusion constraint
-- Only considers statuses that block (pending, confirmed)

WITH ranges AS (
  SELECT 
    id,
    warehouse_id,
    status,
    daterange(start_date, end_date, '[)') AS dr
  FROM public.bookings
  WHERE status IN ('pending','confirmed')
)
SELECT 
  a.id  AS booking_id_a,
  b.id  AS booking_id_b,
  a.warehouse_id,
  a.status AS status_a,
  b.status AS status_b,
  a.dr * b.dr AS overlap_range
FROM ranges a
JOIN ranges b
  ON a.warehouse_id = b.warehouse_id
 AND a.id < b.id
WHERE a.dr && b.dr
ORDER BY a.warehouse_id, a.id, b.id;

-- Resolution options (run manually per your decision):
-- 1) Cancel one of the conflicting bookings:
--    UPDATE public.bookings SET status = 'cancelled' WHERE id = '<booking_id_to_cancel>';
-- 2) Adjust dates to eliminate overlap (e.g., shift start or end):
--    UPDATE public.bookings SET end_date = '<yyyy-mm-dd>' WHERE id = '<booking_id>';
--    UPDATE public.bookings SET start_date = '<yyyy-mm-dd>' WHERE id = '<booking_id>';
-- 3) Temporarily delete test/invalid data:
--    DELETE FROM public.bookings WHERE id IN ('<booking_id_a>', '<booking_id_b>');
-- After cleaning conflicts, re-run scripts/003_prevent_overlapping_bookings.sql