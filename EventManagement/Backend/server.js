const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// App Init
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect DB (Mongoose)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/picsel_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected successfully.');
  
  // Seed Default Admin User
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@picsel.edu' });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const adminOptions = {
        name: 'PICSEL Admin',
        email: 'admin@picsel.edu',
        password: hashedPassword,
        collegeName: 'System',
        department: 'Administration',
        year: 'N/A',
        role: 'ADMIN'
      };
      await User.create(adminOptions);
      console.log('Default Admin Account Created -> Email: admin@picsel.edu | Password: Admin@123');
    }
  } catch(err) {
    console.error('Error seeding admin user:', err);
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Register Student (For student frontend)
const User = require('./models/User');
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, collegeName, department, year, prn } = req.body;
    
    const existingUser = await User.findOne({ email });
    if(existingUser) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, collegeName, department, year, prn });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin / Student Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'super_secret',
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Import Admin Routes
const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);

// Server Start
app.listen(PORT, () => {
    console.log(`PICSEL Server running on port ${PORT}`);
});