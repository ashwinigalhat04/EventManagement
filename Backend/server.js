const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/picsel_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ MongoDB Connected successfully.');

  // Seed Default Admin User
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@picsel.edu' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await User.create({
        name: 'PICSEL Admin',
        email: 'admin@picsel.edu',
        password: hashedPassword,
        mobile: '9999999999',
        collegeName: 'KDK College',
        department: 'Administration',
        year: 'N/A',
        section: 'N/A',
        role: 'ADMIN',
      });
      console.log('👤 Default Admin → Email: admin@picsel.edu | Password: Admin@123');
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
})
.catch(err => console.error('❌ MongoDB error:', err));

// ─── Models (needed by inline auth) ──────────────────────────────────────────
const User = require('./models/User');

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// Register Student
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, mobile, collegeName, department, year, section } = req.body;

    if (!name || !email || !password || !mobile || !collegeName || !department || !year || !section) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      mobile: mobile.trim(),
      collegeName: collegeName.trim(),
      department: department.trim(),
      year: year.trim(),
      section: section.trim(),
      role: 'STUDENT',
    });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'super_secret', { expiresIn: '30d' });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ message: 'Registered successfully', token, user: userObj });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration', details: error.message });
  }
});

// Login (Admin + Student)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'super_secret', { expiresIn: '30d' });

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: 'Login successful', token, user: userObj });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Current user (token-based)
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Token invalid' });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'OK', time: new Date().toISOString() }));

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PICSEL Server running on port ${PORT}`);
  console.log(`📡 API Base: http://0.0.0.0:${PORT}/api`);
});