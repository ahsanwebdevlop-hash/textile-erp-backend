import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const getJwtSecret = () => process.env.JWT_SECRET || 'a7dcaf7293f0f1ddb649fbf0d75845c1b688cba5990a702e8e3c5c39dada0942f941963e5ab2a2d55dd12382e2f9f9e1bb2965b36cd864ddb4dbfa445339ec6';
const generateToken = (user) => jwt.sign({ id: user._id, role: user.role }, getJwtSecret(), { expiresIn: '30d' });

const assertEmailConfiguration = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const error = new Error('Email verification is not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM in server/.env');
    error.statusCode = 503;
    throw error;
  }
};

const sendVerificationEmail = async (user, rawToken) => {
  assertEmailConfiguration();
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email/${rawToken}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verify your TextileFlow account',
    text: `Hello ${user.name}, verify your TextileFlow account here: ${verifyUrl}`,
    html: `<p>Hello ${user.name},</p><p>Verify your TextileFlow account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
};

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
      const accountRole = ['employee', 'manager', 'customer'].includes(String(role).toLowerCase()) ? String(role).toLowerCase() : 'employee';
      assertEmailConfiguration();
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
      const rawToken = crypto.randomBytes(32).toString('hex');
      const user = await User.create({
        name,
        email,
        password,
        role: accountRole,
        emailVerificationToken: crypto.createHash('sha256').update(rawToken).digest('hex'),
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
      });
      try {
        await sendVerificationEmail(user, rawToken);
      } catch (emailError) {
        await User.deleteOne({ _id: user._id });
        throw emailError;
      }
      res.status(201).json({
        success: true,
        message: 'Account created. Check your email to verify your account before signing in.',
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
      if (!user.isEmailVerified) {
        return res.status(403).json({ success: false, message: 'Please verify your email before signing in' });
      }
      res.json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user) },
      });
    } catch (error) { next(error); }
  }
);

router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');
    if (!user) return res.status(400).json({ success: false, message: 'Verification link is invalid or expired' });

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified successfully. You can now sign in.' });
  } catch (error) { next(error); }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    res.json({ success: true, data: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
  } catch (error) { next(error); }
});

export default router;
