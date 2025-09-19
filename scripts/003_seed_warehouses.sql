-- Insert sample warehouses
INSERT INTO public.warehouses (name, description, address, city, state, zip_code, size_sqft, price_per_month, features, images, is_available) VALUES
(
  'Downtown Storage Hub',
  'Modern warehouse facility in the heart of downtown with excellent access to major highways and shipping routes.',
  '123 Industrial Blvd',
  'San Francisco',
  'CA',
  '94105',
  5000,
  2500.00,
  ARRAY['climate_controlled', 'loading_dock', '24_7_access', 'security_cameras'],
  ARRAY['/placeholder.svg?height=300&width=400'],
  true
),
(
  'Eastside Logistics Center',
  'Large warehouse space perfect for distribution and storage operations with ample parking.',
  '456 Commerce Way',
  'San Francisco',
  'CA',
  '94110',
  10000,
  4200.00,
  ARRAY['loading_dock', 'forklift_access', 'office_space', 'parking'],
  ARRAY['/placeholder.svg?height=300&width=400'],
  true
),
(
  'Bay Area Cold Storage',
  'Temperature-controlled warehouse ideal for food, pharmaceuticals, and sensitive materials.',
  '789 Cold Storage Dr',
  'Oakland',
  'CA',
  '94607',
  7500,
  3800.00,
  ARRAY['climate_controlled', 'temperature_zones', 'loading_dock', 'security_system'],
  ARRAY['/placeholder.svg?height=300&width=400'],
  true
),
(
  'Westside Mini Storage',
  'Smaller warehouse units perfect for small businesses and startups.',
  '321 Startup Ave',
  'San Francisco',
  'CA',
  '94107',
  2500,
  1800.00,
  ARRAY['24_7_access', 'security_cameras', 'individual_units'],
  ARRAY['/placeholder.svg?height=300&width=400'],
  true
),
(
  'Port Authority Warehouse',
  'Strategic location near the port with direct access to shipping and rail transport.',
  '654 Port Access Rd',
  'Oakland',
  'CA',
  '94621',
  15000,
  6500.00,
  ARRAY['loading_dock', 'rail_access', 'port_proximity', 'heavy_equipment'],
  ARRAY['/placeholder.svg?height=300&width=400'],
  false
);
