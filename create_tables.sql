-- Optional: Manual DB initialization for Egerton Transport Portal

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  user_type TEXT NOT NULL,
  id_num TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_id TEXT UNIQUE NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  date DATE NOT NULL,
  destination TEXT NOT NULL,
  passenger_count INTEGER NOT NULL,
  trip_purpose TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_id_num TEXT,
  user_type TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  email_id TEXT UNIQUE NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  booking_id TEXT,
  type TEXT
);
