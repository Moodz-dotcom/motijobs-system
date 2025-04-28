// Import required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const redis = require('redis');
const connectRedis = require('connect-redis');
const sequelize = require('./sequelize');  // Ensure this points to the correct file where Sequelize is set up

// Models
const Employee = require('./models/employee');
const Manager = require('./models/Manager');
const Admin = require('./models/Admin');
const Guest = require('./models/Guest');
const Attendance = require('./models/attendance');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Redis Setup
const RedisStore = connectRedis(session);

// Ensure Redis client is connected before using it
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Redis client connection error handling
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
  process.exit(1);  // Exit if Redis connection fails
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Setup with Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure cookie in production
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
}));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Test Database Connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully.'))
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit if DB connection fails
  });

// Sync Database Models
sequelize.sync()
  .then(() => console.log('Models synchronized.'))
  .catch(err => {
    console.error('Model synchronization failed:', err);
    process.exit(1); // Exit if model sync fails
  });

// -------- ROUTES --------

// Home Page
app.get('/', (req, res) => {
  console.log("Root route hit, serving roll.html");
  res.sendFile(path.join(__dirname, 'public', 'roll.html'));
});

// Registration Page
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Register.html')); // Static HTML page
});

// Registration Handler
app.post('/register', upload.single('cv'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, position, department, salary, dateOfJoining, role, password } = req.body;
    const filePath = req.file ? '/uploads/' + req.file.filename : null;

    switch (role) {
      case 'guest':
        await Guest.create({ firstName, lastName, email, phone });
        break;
      case 'employee':
        await Employee.create({
          firstName, lastName, email, phone,
          position, department, salary, dateOfJoining,
          password, cv: filePath
        });
        break;
      case 'manager':
      case 'admin':
        const model = role === 'manager' ? Manager : Admin;
        await model.create({
          firstName, lastName, email, phone,
          department, profilePic: filePath, password
        });
        break;
      default:
        return res.status(400).send('Invalid role');
    }

    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Registration failed');
  }
});

// Login Page (EJS Template)
app.get('/login', (req, res) => {
  res.render('login'); // EJS template for login
});

// Login Handler
app.post('/login', async (req, res) => {
  const { email, role, password } = req.body;

  try {
    let user = null;

    switch (role) {
      case 'guest':
        user = await Guest.findOne({ where: { email } });
        break;
      case 'employee':
        user = await Employee.findOne({ where: { email, password } });
        break;
      case 'manager':
        user = await Manager.findOne({ where: { email, password } });
        break;
      case 'admin':
        user = await Admin.findOne({ where: { email, password } });
        break;
      default:
        return res.send('Invalid role');
    }

    if (!user) return res.send('Invalid email or password');

    req.session.user = {
      role: role,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      id: user.id
    };

    switch (role) {
      case 'employee': return res.redirect('/@indexhtml');
      case 'manager': return res.redirect('/newMan.html');
      case 'admin': return res.redirect('/Home.html');
      case 'guest': return res.redirect('/Gdashboard.html');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error during login');
  }
});

// Logout Handler
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Dashboards (HTML and EJS templates)
// Employee Dashboard (EJS Template)
app.get('/employee-dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'employee') return res.redirect('/login');
  try {
    const employee = await Employee.findOne({ where: { email: req.session.user.email } });
    if (!employee) return res.status(404).send('Employee not found');
    res.render('employee-dashboard', { employee }); // EJS template for employee dashboard
  } catch (err) {
    console.error('Employee dashboard error:', err);
    res.status(500).send('Server Error');
  }
});

// Manager Dashboard (Static HTML)
app.get('/manager-dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'manager') return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'newMan.html')); // Static HTML page for manager dashboard
});

// Admin Dashboard (Static HTML)
app.get('/admin-dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'Home.html')); // Static HTML page for admin dashboard
});

// Guest Dashboard (Static HTML)
app.get('/guest-dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'guest') return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'Gdashboard.html')); // Static HTML page for guest dashboard
});

// Edit Profile (EJS Template for Employee)
app.get('/edit-profile', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'employee') return res.redirect('/login');
  try {
    const employee = await Employee.findOne({ where: { email: req.session.user.email } });
    if (!employee) return res.status(404).send('Employee not found');
    res.render('edit-profile', { employee }); // EJS template for editing profile
  } catch (err) {
    console.error('Edit profile error:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/edit-profile', upload.single('profilePic'), async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'employee') return res.redirect('/login');
  try {
    const { firstName, lastName, email, phone, position, department, salary } = req.body;
    const profilePic = req.file ? '/uploads/' + req.file.filename : null;

    const [updated] = await Employee.update({
      firstName, lastName, email, phone, position, department, salary, profilePic
    }, {
      where: { email: req.session.user.email }
    });

    if (updated === 0) return res.status(404).send('Employee not found or not updated');

    res.redirect('/employee-dashboard');
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).send('Error updating profile');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
``
