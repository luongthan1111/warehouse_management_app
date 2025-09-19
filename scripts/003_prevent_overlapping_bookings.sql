-- Prevent overlapping bookings for the same warehouse (treat pending + confirmed as blocking)
-- Allows back-to-back bookings where next.start_date == current.end_date

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop existing constraint if re-running
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_no_overlap;
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    warehouse_id WITH =,
    (CASE WHEN status IN ('pending','confirmed') THEN daterange(start_date, end_date, '[)') END) WITH &&
  );