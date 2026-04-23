const Membership = require('../models/Membership');
const User = require('../models/User');

exports.getAllStudents = async (req, res) => {
  try {
    const { year, isPaid } = req.query;
    
    let userFilter = { role: 'STUDENT' };
    if (year) userFilter.year = year;
    
    const students = await User.find(userFilter).lean();
    
    for (let student of students) {
      const membership = await Membership.findOne({ userId: student._id });
      student.membership = membership ? membership : { status: 'INACTIVE', feePaid: false };
    }

    // Filter by paid status if supplied
    let result = students;
    if (isPaid !== undefined) {
      const paidBool = isPaid === 'true';
      result = students.filter(s => s.membership.feePaid === paidBool);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching students' });
  }
};

exports.updateMembershipFee = async (req, res) => {
  try {
    const { userId, amount, lateFee, feePaid, status, yearValid } = req.body;
    let membership = await Membership.findOne({ userId });
    
    if (membership) {
      membership.amount = amount || membership.amount;
      membership.lateFee = lateFee || membership.lateFee;
      membership.feePaid = feePaid !== undefined ? feePaid : membership.feePaid;
      membership.status = status || membership.status;
      membership.yearValid = yearValid || membership.yearValid;
      await membership.save();
    } else {
      membership = new Membership({ userId, amount, lateFee, feePaid, status, yearValid });
      await membership.save();
    }

    res.json({ message: 'Membership updated', membership });
  } catch (error) {
    res.status(500).json({ error: 'Error updating membership' });
  }
};
