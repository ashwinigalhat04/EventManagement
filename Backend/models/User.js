const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  mobile:     { type: String, required: true },
  collegeName:{ type: String, required: true },
  department: { type: String, required: true },
  year:       { type: String, required: true },
  section:    { type: String, required: true },
  role:       { type: String, enum: ['STUDENT', 'ADMIN'], default: 'STUDENT' },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
