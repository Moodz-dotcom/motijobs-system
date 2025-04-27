// Import necessary modules
const express = require('express');
const session = require('express-session');
const connectRedis = require('connect-redis');
const redis = require('redis');
const Sequelize = require('sequelize');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

// Create the Redis client
const RedisClient = redis.createClient();

// Create the RedisStore using connect-redis and session
const RedisStore = connectRedis(session); // This should work with the newer connect-redis version

// Initialize Express app
const app = express();

// Set up body-parser middleware for handling form data
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Sequelize setup for SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

// Test Sequelize connection
sequelize.authenticate()
  .then(() => console.log('Database connected!'))
  .catch((err) => console.error('Unable to connect to the database:', err));

// Session middleware configuration using Redis
app.use(
  session({
    store: new RedisStore({ client: RedisClient }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true if using https
      maxAge: 3600000, // 1 hour
    },
  })
);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Define models (e.g., Employee)
const Employee = sequelize.define('Employee', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

// Sync models with the database
sequelize.sync();

// Define routes
app.get('/', (req, res) => {
  res.send('Welcome to the HR System');
});

// Registration route (example)
app.post('/register', upload.single('cv'), async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const employee = await Employee.create({ name, email, password });
    res.send('Employee registered successfully!');
  } catch (error) {
    res.status(500).send('Error registering employee');
  }
});

// Sample route for handling file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send('File uploaded successfully.');
});

// Sample login route for testing session
app.get('/login', (req, res) => {
  req.session.user = { username: 'testuser' };
  res.send('Logged in successfully');
});

// Sample route to check session
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.send(`Hello, ${req.session.user.username}`);
  } else {
    res.send('No session found');
  }
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).send('Page Not Found');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
