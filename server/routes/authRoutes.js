import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'a7dcaf7293f0f1ddb649fbf0d75845c1b688c8ba5990a702e8e3c5c39dada0942f941963e5ab2a2d55dd12382e2f9f9e1bb2965b36cd864ddb4dbfa445339ec6';
const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }
      const { name, email, password, role } = req.body;
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
      const user = await User.create({ name, email, password, role: role || 'employee' });
      res.status(201).json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) },
      });
    } catch (error) { next(error); }
  }
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      res.json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) },
      });
    } catch (error) { next(error); }
  }
);

router.get('/me', protect, async (req, res, next) => {
  try {
    res.json({ success: true, data: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
  } catch (error) { next(error); }
});

export default router;
