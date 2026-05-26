const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs');
const pathModule = require('path');
const { body, query, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const compression = require('compression');
require('dotenv').config();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const DATABASE_URL = process.env.DATABASE_URL || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();
app.disable('x-powered-by');

// Compression middleware for gzip/brotli
app.use(compression());

// Cache-control headers for static assets (1 year immutable)
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/i)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// ETag support for efficient caching
app.set('etag', true);

// Ensure logs folder exists and set up request logging
fs.mkdirSync(pathModule.join(__dirname, 'logs'), { recursive: true });
const accessLogStream = fs.createWriteStream(pathModule.join(__dirname, 'logs', 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// Strict security headers and CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginResourcePolicy: { policy: 'same-origin' }
}));

// Apply CORS specifically for API routes with explicit allowed headers
app.use(cors({ origin: CORS_ORIGIN, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], credentials: true }));
app.use('/api', cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 600
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

if (NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use((req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (req.secure || forwardedProto === 'https') {
      return next();
    }
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  });
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// MySQL pool (if DATABASE_URL is mysql://... or DB_CLIENT=mysql)
function parseMysqlUrl(url) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port || 3306,
      user: u.username,
      password: u.password,
      database: u.pathname.replace(/^\//, '')
    };
  } catch (e) {
    return null;
  }
}

let mysqlPool = null;
if (DATABASE_URL && (DATABASE_URL.startsWith('mysql://') || process.env.DB_CLIENT === 'mysql')) {
  const cfg = parseMysqlUrl(DATABASE_URL) || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'egerton_transport'
  };

  mysqlPool = mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
} else {
  // keep mysqlPool null; server will run in in-memory fallback mode
  mysqlPool = null;
}

const inMemoryStore = {
  users: [
    {
      username: 'transport_admin',
      email: 'transport.admin@gmail.com',
      passwordHash: bcrypt.hashSync('Admin123', 10),
      userType: 'admin',
      idNum: 'ADM-TRANS-01',
      createdAt: new Date().toISOString()
    },
    {
      username: 'staff_demo',
      email: 'j.doe@gmail.com',
      passwordHash: bcrypt.hashSync('Password123', 10),
      userType: 'staff',
      idNum: 'EST-9023',
      createdAt: new Date().toISOString()
    },
    {
      username: 'student_demo',
      email: 'alex.k@gmail.com',
      passwordHash: bcrypt.hashSync('Student123', 10),
      userType: 'student',
      idNum: 'S23/04812/21',
      createdAt: new Date().toISOString()
    }
  ],
  bookings: [],
  emailLogs: []
};

async function createTables() {
  if (!mysqlPool) {
    console.warn('No MySQL pool detected. Server is running in in-memory fallback mode. Configure DATABASE_URL for production persistence.');
    return;
  }

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      user_type VARCHAR(50) NOT NULL,
      id_num VARCHAR(64),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id VARCHAR(100) UNIQUE NOT NULL,
      vehicle_id VARCHAR(100) NOT NULL,
      vehicle_name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      destination TEXT NOT NULL,
      passenger_count INT NOT NULL,
      trip_purpose TEXT NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_id_num VARCHAR(64),
      user_type VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email_id VARCHAR(100) UNIQUE NOT NULL,
      to_address VARCHAR(255) NOT NULL,
      subject TEXT NOT NULL,
      body LONGTEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      booking_id VARCHAR(100),
      type VARCHAR(50)
    );
  `);

  const [rows] = await mysqlPool.query('SELECT COUNT(*) AS count FROM users');
  if (parseInt(rows[0].count, 10) === 0) {
    await mysqlPool.query(
      `INSERT INTO users (username, email, password_hash, user_type, id_num) VALUES (?, ?, ?, ?, ?)`,
      ['transport_admin', 'transport.admin@gmail.com', bcrypt.hashSync('Admin123', 10), 'admin', 'ADM-TRANS-01']
    );
  }
}

async function findUserByEmailOrUsername(search) {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query(
      'SELECT username, email, password_hash, user_type, id_num FROM users WHERE email = ? OR username = ? LIMIT 1',
      [search, search]
    );
    return rows[0] || null;
  }
  return inMemoryStore.users.find(u => u.email === search || u.username === search) || null;
}

async function findUserByEmail(email) {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query('SELECT username, email, password_hash, user_type, id_num FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  }
  return inMemoryStore.users.find(u => u.email === email) || null;
}

async function createUser(user) {
  if (mysqlPool) {
    const [result] = await mysqlPool.query(
      `INSERT INTO users (username, email, password_hash, user_type, id_num) VALUES (?, ?, ?, ?, ?)`,
      [user.username, user.email, user.passwordHash, user.userType, user.idNum]
    );
    const [rows] = await mysqlPool.query('SELECT username, email, user_type AS userType, id_num AS idNum FROM users WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  const newUser = {
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    userType: user.userType,
    idNum: user.idNum,
    createdAt: new Date().toISOString()
  };
  inMemoryStore.users.push(newUser);
  return {
    username: newUser.username,
    email: newUser.email,
    userType: newUser.userType,
    idNum: newUser.idNum
  };
}

async function createBooking(booking) {
  if (mysqlPool) {
    const [result] = await mysqlPool.query(
      `INSERT INTO bookings (booking_id, vehicle_id, vehicle_name, date, destination, passenger_count, trip_purpose, user_email, user_name, user_id_num, user_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.bookingId,
        booking.vehicleId,
        booking.vehicleName,
        booking.date,
        booking.destination,
        booking.passengerCount,
        booking.tripPurpose,
        booking.userEmail,
        booking.userName,
        booking.userIdNum,
        booking.userType,
        booking.status
      ]
    );
    const [rows] = await mysqlPool.query('SELECT booking_id AS bookingId, vehicle_id AS vehicleId, vehicle_name AS vehicleName, date, destination, passenger_count AS passengerCount, trip_purpose AS tripPurpose, user_email AS userEmail, user_name AS userName, user_id_num AS userIdNum, user_type AS userType, status FROM bookings WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  inMemoryStore.bookings.push(booking);
  return booking;
}

async function findBookingsByEmail(email) {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query(
      `SELECT booking_id AS bookingId, vehicle_id AS vehicleId, vehicle_name AS vehicleName, date, destination, passenger_count AS passengerCount, trip_purpose AS tripPurpose, user_email AS userEmail, user_name AS userName, user_id_num AS userIdNum, user_type AS userType, status
       FROM bookings
       WHERE user_email = ?
       ORDER BY date DESC`,
      [email]
    );
    return rows;
  }
  return inMemoryStore.bookings.filter(b => b.userEmail === email).sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function getAllBookings() {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query(
      `SELECT booking_id AS bookingId, vehicle_id AS vehicleId, vehicle_name AS vehicleName, date, destination, passenger_count AS passengerCount, trip_purpose AS tripPurpose, user_email AS userEmail, user_name AS userName, user_id_num AS userIdNum, user_type AS userType, status
       FROM bookings
       ORDER BY date DESC`
    );
    return rows;
  }
  return [...inMemoryStore.bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function hasDuplicateBooking(vehicleId, date, userEmail) {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query(
      `SELECT COUNT(*) AS count FROM bookings WHERE vehicle_id = ? AND date = ? AND user_email = ?`,
      [vehicleId, date, userEmail]
    );
    return parseInt(rows[0].count, 10) > 0;
  }
  return inMemoryStore.bookings.some(b => b.vehicleId === vehicleId && b.date === date && b.userEmail === userEmail);
}

async function logEmail(emailRecord) {
  if (mysqlPool) {
    await mysqlPool.query(
      `INSERT INTO email_logs (email_id, to_address, subject, body, booking_id, type) VALUES (?, ?, ?, ?, ?, ?)` ,
      [emailRecord.emailId, emailRecord.to, emailRecord.subject, emailRecord.body, emailRecord.bookingId, emailRecord.type]
    );
    return emailRecord;
  }
  inMemoryStore.emailLogs.unshift(emailRecord);
  return emailRecord;
}

function buildBookingEmail(user, booking) {
  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const subject = booking.status === 'Pending'
    ? `Egerton Transport Booking Request Received — ${booking.bookingId}`
    : `Egerton Transport Booking Confirmed — ${booking.bookingId}`;

  const body = `Dear ${user.username},\n\n` +
    `Your transport booking for ${booking.vehicleName} on ${formattedDate} to ${booking.destination} has been recorded with status: ${booking.status}.\n\n` +
    `Booking Reference: ${booking.bookingId}\n` +
    `Passengers: ${booking.passengerCount}\n` +
    `Trip Purpose: ${booking.tripPurpose}\n\n` +
    `Please keep this email for your records. If the booking is pending approval, we will notify you when the request is reviewed.\n\n` +
    `Regards,\nEgerton University Transport Department`;

  return {
    emailId: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    to: user.email,
    subject,
    body,
    sentAt: new Date().toISOString(),
    bookingId: booking.bookingId,
    type: 'booking_confirmation'
  };
}

// Ensure JSON body parsing for API routes
app.use('/api', express.json());

// Accept OPTIONS preflight for all /api/* endpoints to avoid "Method Not Allowed" on CORS preflight
app.options('/api/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res.sendStatus(204);
});

// Debug logging for API requests: method, path, headers, and parsed body (written to logs/request-debug.log)
try {
  const debugLogPath = pathModule.join(__dirname, 'logs', 'request-debug.log');
  const debugLogStream = fs.createWriteStream(debugLogPath, { flags: 'a' });
  app.use('/api', (req, res, next) => {
    const safeBody = (() => {
      try { return JSON.stringify(req.body); } catch (e) { return '<unserializable body>'; }
    })();
    const entry = `[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.originalUrl} headers=${JSON.stringify(req.headers)} body=${safeBody}\n`;
    debugLogStream.write(entry);
    next();
  });
} catch (err) {
  console.warn('Could not create request debug stream', err);
}

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', environment: NODE_ENV });
});

app.post('/api/auth/signup',
  body('username').isLength({ min: 5, max: 20 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 20 }),
  body('userType').isIn(['student', 'staff']),
  body('idNum').isLength({ min: 4, max: 30 }).trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { username, email, password, userType, idNum } = req.body;
    try {
      const existing = await findUserByEmailOrUsername(email);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email or username is already registered.' });
      }
      const passwordHash = bcrypt.hashSync(password, 10);
      const user = await createUser({ username, email, passwordHash, userType, idNum });
      return res.json({ success: true, message: 'Account registered successfully.', user });
    } catch (error) {
      console.error('Signup error', error);
      return res.status(500).json({ success: false, message: 'Unable to register account at this time.' });
    }
  }
);

app.post('/api/auth/login',
  body('emailOrUsername').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors: errors.array() });
    }

    const { emailOrUsername, password } = req.body;
    try {
      const user = await findUserByEmailOrUsername(emailOrUsername);
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
      }

      return res.json({ success: true, message: 'Login successful.', user: {
        username: user.username,
        email: user.email,
        userType: user.userType,
        idNum: user.idNum
      }});
    } catch (error) {
      console.error('Login error', error);
      return res.status(500).json({ success: false, message: 'Authentication service unavailable.' });
    }
  }
);

app.get('/api/bookings',
  query('email').optional().isEmail().normalizeEmail(),
  query('admin').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid booking query.', errors: errors.array() });
    }

    try {
      if (req.query.email) {
        const bookings = await findBookingsByEmail(req.query.email);
        return res.json({ success: true, bookings });
      }

      if (req.query.admin === 'true') {
        const bookings = await getAllBookings();
        return res.json({ success: true, bookings });
      }

      return res.status(400).json({ success: false, message: 'Booking query must include email or admin=true.' });
    } catch (error) {
      console.error('Fetch bookings error', error);
      return res.status(500).json({ success: false, message: 'Unable to fetch bookings.' });
    }
  }
);

app.post('/api/bookings',
  body('vehicleId').trim().notEmpty().escape(),
  body('vehicleName').trim().notEmpty().escape(),
  body('date').isISO8601().toDate(),
  body('destination').trim().notEmpty().escape(),
  body('passengerCount').isInt({ min: 1 }),
  body('tripPurpose').trim().notEmpty().escape(),
  body('userEmail').isEmail().normalizeEmail(),
  body('userName').trim().notEmpty().escape(),
  body('userIdNum').trim().notEmpty().escape(),
  body('userType').trim().isIn(['student', 'staff', 'admin']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Booking data invalid.', errors: errors.array() });
    }

    try {
      const { vehicleId, vehicleName, date, destination, passengerCount, tripPurpose, userEmail, userName, userIdNum, userType } = req.body;
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        return res.status(400).json({ success: false, message: 'Trip date must be today or in the future.' });
      }

      if (await hasDuplicateBooking(vehicleId, bookingDate.toISOString().split('T')[0], userEmail)) {
        return res.status(409).json({ success: false, message: 'You already have a booking request for this vehicle on that date.' });
      }

      const bookingId = `EGT-${Math.floor(10000 + Math.random() * 90000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
      const newBooking = {
        bookingId,
        vehicleId,
        vehicleName,
        date: bookingDate.toISOString().split('T')[0],
        destination,
        passengerCount: parseInt(passengerCount, 10),
        tripPurpose,
        userEmail,
        userName,
        userIdNum,
        userType,
        status: 'Pending'
      };

      const booking = await createBooking(newBooking);
      const user = await findUserByEmail(userEmail);
      const emailNotification = buildBookingEmail(user || { username: userName, email: userEmail }, booking);
      await logEmail(emailNotification);

      return res.json({ success: true, message: 'Booking created successfully.', booking, emailNotification });
    } catch (error) {
      console.error('Booking creation error', error);
      return res.status(500).json({ success: false, message: 'Unable to process booking at this time.' });
    }
  }
);

app.post('/api/bookings/cancel',
  body('bookingId').trim().notEmpty().escape(),
  body('userEmail').isEmail().normalizeEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid cancellation request.', errors: errors.array() });
    }

    try {
      const { bookingId, userEmail } = req.body;
      if (mysqlPool) {
        const [result] = await mysqlPool.query(
          'DELETE FROM bookings WHERE booking_id = ? AND user_email = ?',
          [bookingId, userEmail]
        );
        if (!result || result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Booking not found or not authorized to cancel.' });
        }
      } else {
        const originalLength = inMemoryStore.bookings.length;
        inMemoryStore.bookings = inMemoryStore.bookings.filter(b => !(b.bookingId === bookingId && b.userEmail === userEmail));
        if (inMemoryStore.bookings.length === originalLength) {
          return res.status(404).json({ success: false, message: 'Booking not found or not authorized to cancel.' });
        }
      }

      return res.json({ success: true, message: 'Booking cancelled successfully.' });
    } catch (error) {
      console.error('Cancel booking error', error);
      return res.status(500).json({ success: false, message: 'Unable to cancel booking right now.' });
    }
  }
);

app.use(express.static(path.join(__dirname)));

app.listen(PORT, async () => {
  try {
    await createTables();
    console.log(`Server is running on port ${PORT}.`);
    if (!DATABASE_URL) {
      console.log('Warning: no DATABASE_URL detected. Running with in-memory fallback storage. Add a DATABASE_URL for persistent deployment.');
    }
  } catch (error) {
    console.error('Server initialization failed', error);
    process.exit(1);
  }
});

// If any /api/* route reaches here it means method/route was not matched — return 405 Method Not Allowed
app.use('/api/*', (req, res) => {
  res.set('Allow', 'GET,POST,PUT,DELETE,OPTIONS');
  return res.status(405).json({ success: false, message: 'Method Not Allowed for this API endpoint.' });
});

// Enforce HTTPS in production behind proxy/load-balancer
if (NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}
