const Membership = require('../models/Membership');
const User = require('../models/User');

exports.getAllStudents = async (req, res) => {
  try {
    const { year, isPaid, status } = req.query;
    let userFilter = { role: 'STUDENT' };
    if (year) userFilter.year = year;

    const students = await User.find(userFilter).select('-password').lean();
    for (let student of students) {
      const membership = await Membership.findOne({ userId: student._id });
      student.membership = membership || { status: 'INACTIVE', feePaid: false };
    }

    let result = students;
    if (isPaid !== undefined) {
      const paidBool = isPaid === 'true';
      result = students.filter(s => s.membership.feePaid === paidBool);
    }
    if (status) {
      result = result.filter(s => s.membership.status === status);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching students' });
  }
};

exports.updateMembershipFee = async (req, res) => {
  try {
    const { userId, amount, feePaid, status, yearValid } = req.body;
    let membership = await Membership.findOne({ userId });

    if (membership) {
      if (amount !== undefined) membership.amount = amount;
      if (feePaid !== undefined) membership.feePaid = feePaid;
      if (status) membership.status = status;
      if (yearValid) membership.yearValid = yearValid;
      if (feePaid && !membership.paidAt) membership.paidAt = new Date();
      if (status === 'ACTIVE' && !membership.expiryDate) {
        const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
        membership.expiryDate = exp;
      }
      membership.updatedAt = new Date();
      await membership.save();
    } else {
      const count = await Membership.countDocuments();
      const membershipId = `PICSEL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
      const expiryDate = status === 'ACTIVE' ? (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; })() : null;
      membership = await Membership.create({ userId, membershipId, amount, feePaid, status: status || 'INACTIVE', yearValid, expiryDate, paidAt: feePaid ? new Date() : null });
    }

    res.json({ message: 'Membership updated', membership });
  } catch (error) {
    res.status(500).json({ error: 'Error updating membership' });
  }
};
