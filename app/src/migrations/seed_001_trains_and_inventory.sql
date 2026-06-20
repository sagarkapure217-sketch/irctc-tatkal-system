-- Seed: 001_seed_trains_and_inventory.sql
-- Inserts demo trains and sample inventory for development/testing.
-- Run AFTER migrations 001, 002, and 003.

-- ─── Trains ──────────────────────────────────────────────────────────────────

INSERT INTO trains (train_number, train_name, source_station, destination_station)
VALUES
    ('12301', 'Rajdhani Express',  'New Delhi',   'Howrah Junction'),
    ('12002', 'Shatabdi Express',  'New Delhi',   'Bhopal Junction'),
    ('12213', 'Duronto Express',   'Mumbai CST',  'New Delhi'),
    ('12627', 'Karnataka Express', 'New Delhi',   'KSR Bengaluru'),
    ('22691', 'Rajdhani Express',  'KSR Bengaluru', 'Hazrat Nizamuddin')
ON CONFLICT (train_number) DO NOTHING;

-- ─── Inventory ───────────────────────────────────────────────────────────────
-- We reference trains by their train_number to make the seed
-- self-contained and order-independent.

-- Rajdhani Express (12301): New Delhi → Howrah
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

-- Shatabdi Express (12002): New Delhi → Bhopal
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

-- Duronto Express (12213): Mumbai CST → New Delhi
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
