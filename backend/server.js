require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Models
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String },
  date: { type: Date, required: true },
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  limit: { type: Number, required: true, default: 0 }
});
const Budget = mongoose.model('Budget', BudgetSchema);

// Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Auth Error' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};
// Routes - Root
app.get('/', (req, res) => {
  res.send('FinGuard API is running perfectly!');
});

// Routes - Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = new User({ email, password: hashedPassword });
    await user.save();
    
    // Instead of creating a budget here right away, we allow users to set it later.
    // Creating default budget:
    const budget = new Budget({ userId: user._id, limit: 1000 });
    await budget.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, userId: user._id, email });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, userId: user._id, email });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Routes - Transactions
app.get('/api/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/transactions', auth, async (req, res) => {
  try {
    const { type, amount, category, date } = req.body;
    const newTransaction = new Transaction({
      userId: req.user.userId,
      type, amount, category, date
    });
    await newTransaction.save();
    res.json(newTransaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Routes - Budget
app.get('/api/budget', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ userId: req.user.userId });
    res.json(budget || { limit: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/budget', auth, async (req, res) => {
  try {
    const { limit } = req.body;
    let budget = await Budget.findOne({ userId: req.user.userId });
    if (budget) {
      budget.limit = limit;
      await budget.save();
    } else {
      budget = new Budget({ userId: req.user.userId, limit });
      await budget.save();
    }
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Routes - AI Suggestions
app.get('/api/ai/suggestions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId, type: 'expense' });
    
    // Very simple dummy AI: finds highest spending category
    const categoryTotals = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    let highestCategory = '';
    let highestAmount = 0;
    Object.keys(categoryTotals).forEach(cat => {
      if (categoryTotals[cat] > highestAmount) {
        highestAmount = categoryTotals[cat];
        highestCategory = cat;
      }
    });

    let suggestions = [];
    if (highestCategory) {
      suggestions.push(`You are spending the most on ${highestCategory} this month. Consider cutting down to save money!`);
    } else {
      suggestions.push("You don't have any expenses yet. Great job saving!");
    }

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/finguard';


module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  // In production (Vercel), we just connect to DB
  mongoose.connect(MONGODB_URI)
    .catch(err => console.error('MongoDB connection error:', err));
}
