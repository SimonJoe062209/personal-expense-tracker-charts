import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { SettingsModel } from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { DEMO_CREDENTIALS } from '../seed/demoSeed';
import { INITIAL_USER_SETTINGS } from '../../src/data/seedData';

const JWT_SECRET = process.env.JWT_SECRET || 'moneta_jwt_secret_dev_key_2026';
const JWT_EXPIRES_IN = '7d';

const generateToken = (user: any) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      isDemo: user.isDemo || false,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      isDemo: false,
    });

    // Create initial user settings
    await SettingsModel.create({
      userId: user._id,
      currency: INITIAL_USER_SETTINGS.currency,
      currencySymbol: INITIAL_USER_SETTINGS.currencySymbol,
      currencyLocale: INITIAL_USER_SETTINGS.currencyLocale,
      theme: 'light',
      openingBalance: 0,
      userName: user.name,
      monthlySavingsTargetPct: 25,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isDemo: user.isDemo,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isDemo: user.isDemo,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const demoLogin = async (_req: Request, res: Response): Promise<void> => {
  try {
    let demoUser = await User.findOne({ email: DEMO_CREDENTIALS.email });

    if (!demoUser) {
      // Re-seed if missing
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(DEMO_CREDENTIALS.password, salt);
      demoUser = await User.create({
        name: DEMO_CREDENTIALS.name,
        email: DEMO_CREDENTIALS.email,
        passwordHash,
        isDemo: true,
      });
    }

    const token = generateToken(demoUser);

    res.json({
      message: 'Logged in as Demo User',
      token,
      user: {
        id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        isDemo: true,
      },
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Could not authenticate demo user.' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};
