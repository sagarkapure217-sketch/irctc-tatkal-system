-- Seed: 002_seed_stations_trains_inventory.sql
-- Replaces seed_001_trains_and_inventory.sql with the normalised design.
--
-- Order:
--   1. Stations
--   2. Trains (referencing station IDs by station_code sub-select)
--   3. Train inventory
--
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.

-- ─── 1. Stations ─────────────────────────────────────────────────────────────

INSERT INTO stations (station_code, station_name, city, state) VALUES
    ('NDLS', 'New Delhi',                          'New Delhi',    'Delhi'),
    ('NZM',  'Hazrat Nizamuddin',                  'New Delhi',    'Delhi'),
    ('DLI',  'Old Delhi Junction',                 'New Delhi',    'Delhi'),
    ('HWH',  'Howrah Junction',                    'Howrah',       'West Bengal'),
    ('SDAH', 'Sealdah',                            'Kolkata',      'West Bengal'),
    ('CSMT', 'Chhatrapati Shivaji Maharaj Terminus','Mumbai',      'Maharashtra'),
    ('BCT',  'Mumbai Central',                     'Mumbai',       'Maharashtra'),
    ('BPL',  'Bhopal Junction',                    'Bhopal',       'Madhya Pradesh'),
    ('SBC',  'KSR Bengaluru City Junction',        'Bengaluru',    'Karnataka'),
    ('MAS',  'Chennai Central',                    'Chennai',       'Tamil Nadu'),
    ('SC',   'Secunderabad Junction',              'Hyderabad',    'Telangana'),
    ('HYB',  'Hyderabad Deccan',                   'Hyderabad',    'Telangana'),
    ('PUNE', 'Pune Junction',                      'Pune',         'Maharashtra'),
    ('ADI',  'Ahmedabad Junction',                 'Ahmedabad',    'Gujarat'),
    ('JP',   'Jaipur Junction',                    'Jaipur',       'Rajasthan'),
    ('LKO',  'Lucknow Charbagh',                   'Lucknow',      'Uttar Pradesh'),
    ('CNB',  'Kanpur Central',                     'Kanpur',       'Uttar Pradesh'),
    ('PNBE', 'Patna Junction',                     'Patna',        'Bihar'),
    ('GHY',  'Guwahati',                           'Guwahati',     'Assam'),
    ('JAT',  'Jammu Tawi',                         'Jammu',        'Jammu & Kashmir')
ON CONFLICT (station_code) DO NOTHING;

-- ─── 2. Trains ───────────────────────────────────────────────────────────────
-- Station IDs are resolved by station_code at insert time via sub-selects,
-- so the seed stays readable and order-independent after stations are loaded.

INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id)
SELECT
    '12301',
    'Rajdhani Express',
    (SELECT id FROM stations WHERE station_code = 'NDLS'),
    (SELECT id FROM stations WHERE station_code = 'HWH')
ON CONFLICT (train_number) DO NOTHING;

INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id)
SELECT
    '12002',
    'Shatabdi Express',
    (SELECT id FROM stations WHERE station_code = 'NDLS'),
    (SELECT id FROM stations WHERE station_code = 'BPL')
ON CONFLICT (train_number) DO NOTHING;

INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id)
SELECT
    '12213',
    'Duronto Express',
    (SELECT id FROM stations WHERE station_code = 'CSMT'),
    (SELECT id FROM stations WHERE station_code = 'NDLS')
ON CONFLICT (train_number) DO NOTHING;

INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id)
SELECT
    '12627',
    'Karnataka Express',
    (SELECT id FROM stations WHERE station_code = 'NDLS'),
    (SELECT id FROM stations WHERE station_code = 'SBC')
ON CONFLICT (train_number) DO NOTHING;

INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id)
SELECT
    '22691',
    'Rajdhani Express',
    (SELECT id FROM stations WHERE station_code = 'SBC'),
    (SELECT id FROM stations WHERE station_code = 'NZM')
ON CONFLICT (train_number) DO NOTHING;

-- ─── 3. Train Inventory ──────────────────────────────────────────────────────
-- Identical seat counts to the previous seed; only the reference method changes.

-- Rajdhani Express (12301): NDLS → HWH
INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'Sleeper', 200, 120 FROM trains t WHERE t.train_number = '12301'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'AC3', 120, 45 FROM trains t WHERE t.train_number = '12301'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'AC2', 72, 10 FROM trains t WHERE t.train_number = '12301'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'Sleeper', 200, 180 FROM trains t WHERE t.train_number = '12301'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'AC3', 120, 98 FROM trains t WHERE t.train_number = '12301'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'AC2', 72, 40 FROM trains t WHERE t.train_number = '12301'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

-- Shatabdi Express (12002): NDLS → BPL
INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'Sleeper', 300, 210 FROM trains t WHERE t.train_number = '12002'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'AC3', 150, 80 FROM trains t WHERE t.train_number = '12002'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'AC2', 80, 0 FROM trains t WHERE t.train_number = '12002'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'Sleeper', 300, 299 FROM trains t WHERE t.train_number = '12002'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'AC3', 150, 135 FROM trains t WHERE t.train_number = '12002'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'AC2', 80, 60 FROM trains t WHERE t.train_number = '12002'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

-- Duronto Express (12213): CSMT → NDLS
INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'Sleeper', 250, 50 FROM trains t WHERE t.train_number = '12213'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'AC3', 130, 20 FROM trains t WHERE t.train_number = '12213'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-01', 'AC2', 60, 5 FROM trains t WHERE t.train_number = '12213'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'Sleeper', 250, 200 FROM trains t WHERE t.train_number = '12213'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'AC3', 130, 110 FROM trains t WHERE t.train_number = '12213'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;

INSERT INTO train_inventory (train_id, journey_date, travel_class, total_seats, available_seats)
SELECT t.id, '2025-08-02', 'AC2', 60, 55 FROM trains t WHERE t.train_number = '12213'
ON CONFLICT (train_id, journey_date, travel_class) DO NOTHING;
