const express = require('express');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const sequelize = require('./sequelize');

// Models
const Employee = require('./models/employee');
const Manager = require('./models/manager');
const Admin = require('./models/admin');
const Guest = require('./models/guest');
const Attendance = require('./models/attendance');

const app = express();

// Important: Use process.env.PORT for hosting platforms like Render, Vercel, etc.
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'yourSecretKey', // Change this secret key in production!
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS (production)
    maxAge: 1000 * 60 * 60 * 2 // Session expires in 2 hours
  }
}));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Sync all models
sequelize.sync().then(() => {
  console.log('All models synced');
}).catch(err => console.error('Sync error:', err));

// Routes
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Registration Route
app.post('/register', upload.single('cv'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, position, department, salary, dateOfJoining, role, password } = req.body;
    const filePath = req.file ? '/uploads/' + req.file.filename : null;

    if (role === 'guest') {
      // For guests, no password, CV, salary, or position are required
      await Guest.create({
        firstName,
        lastName,
        email,
        phone
      });
    } else if (role === 'employee') {
      // For employees, manager, and admin, include password, position, salary, and department
      await Employee.create({
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        salary,
        dateOfJoining,
        password,
        cv: filePath
      });
    } else if (role === 'manager') {
      await Manager.create({
        firstName,
        lastName,
        email,
        phone,
        department,
        profilePic: filePath,
        password
      });
    } else if (role === 'admin') {
      await Admin.create({
        firstName,
        lastName,
        email,
        phone,
        department,
        profilePic: filePath,
        password
      });
    } else {
      return res.status(400).send('Invalid role');
    }

    return res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Registration failed');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'roll.html'));
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, role, password } = req.body;
  try {
    let user = null;

    if (role === 'guest') {
      // For guests, no password check, just check if the email exists
      user = await Guest.findOne({ where: { email } });
    } else if (role === 'employee') {
      user = await Employee.findOne({ where: { email, password } });
    } else if (role === 'manager') {
      user = await Manager.findOne({ where: { email, password } });
    } else if (role === 'admin') {
      user = await Admin.findOne({ where: { email, password } });
    }

    if (!user) return res.send('Invalid email or password');

    req.session.user = {
      role: role,
      email: user.email,
      name: user.name || `${user.firstName} ${user.lastName}`,
      id: user.id
    };

    // Redirect based on role
    if (role === 'employee') return res.redirect('/employee-dashboard');
    if (role === 'manager') return res.redirect('/manager-dashboard');
    if (role === 'admin') return res.redirect('/admin-dashboard');
    if (role === 'guest') return res.redirect('/guest-dashboard');

    res.send('Invalid role');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error during login');
  }
});

// Logout
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

// Dashboards
app.get('/employee-dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'employee') return res.redirect('/');
  try {
    const employee = await Employee.findOne({ where: { email: req.session.user.email } });
    if (!employee) return res.status(404).send('Employee not found');
    res.render('employee-dashboard', { employee });
  } catch (err) {
    console.error('Employee dashboard error:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/manager-dashboard', (req, res) => {
  if (req.session.user?.role !== 'manager') return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'newMan.html'));
});

app.get('/admin-dashboard', (req, res) => {
  if (req.session.user?.role !== 'admin') return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});

app.get('/guest-dashboard', (req, res) => {
  if (req.session.user?.role !== 'guest') return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'Gdashboard.html'));
});

// Edit Profile
app.get('/edit-profile', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'employee') return res.redirect('/login');
  try {
    const employee = await Employee.findOne({ where: { email: req.session.user.email } });
    if (!employee) return res.status(404).send('Employee not found');
    res.render('edit-profile', { employee });
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

    const updated = await Employee.update({
      firstName, lastName, email, phone, position, department, salary, profilePic
    }, {
      where: { email: req.session.user.email }
    });

    if (updated[0] === 0) return res.status(404).send('Employee not found or not updated');

    res.redirect('/employee-dashboard');
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).send('Error updating profile');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
