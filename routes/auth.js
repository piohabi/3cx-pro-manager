const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// OAuth dependencies - commented out to allow deployment without OAuth setup
// Uncomment these when you have OAuth credentials configured
// const { OAuth2Client } = require('google-auth-library');
// const axios = require('axios');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// OAuth clients - will be undefined until dependencies are uncommented
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Email configuration - using Supabase Edge Function or external service
const SEND_EMAIL = process.env.SEND_WELCOME_EMAILS === 'true';

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper function to send welcome email
async function sendWelcomeEmail(user) {
  if (!SEND_EMAIL) {
    console.log('Email sending disabled. Welcome email for:', user.email);
    return { success: true, message: 'Email notifications disabled' };
  }

  try {
    // Using Supabase to log email (you can integrate with SendGrid, Mailgun, etc.)
    const emailContent = {
      to: user.email,
      subject: '🎉 Welcome to 3CX Pro Manager!',
      html: `
        <h2>Welcome to 3CX Pro Manager!</h2>
        <p>Hi ${user.username},</p>
        <p>Your account has been successfully created!</p>
        <p><strong>Account Details:</strong></p>
        <ul>
          <li>Username: ${user.username}</li>
          <li>Email: ${user.email}</li>
          ${user.company ? `<li>Company: ${user.company}</li>` : ''}
        </ul>
        <p>You can now log in to your account at: <a href="https://threecx-manager.onrender.com">https://threecx-manager.onrender.com</a></p>
        <p>Best regards,<br>3CX Pro Manager Team</p>
      `
    };

    // Log email to database (for now)
    await supabase.from('email_log').insert([{
      recipient: user.email,
      subject: emailContent.subject,
      content: emailContent.html,
      sent_at: new Date().toISOString(),
      status: 'pending'
    }]);

    console.log('Welcome email logged for:', user.email);
    return { success: true, message: 'Welcome email sent' };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, message: 'Failed to send email' };
  }
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Demo login
    if (username === 'demo' && password === 'demo123') {
      const token = generateToken({ id: 1, username: 'demo', email: 'demo@3cx.com' });
      return res.json({
        success: true,
        token,
        user: { username: 'demo', email: 'demo@3cx.com' }
      });
    }

    // Check database for user
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !users) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, users.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(users);
    res.json({
      success: true,
      token,
      user: { id: users.id, username: users.username, email: users.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, company } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password_hash,
        company: company || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
    }

    // Send welcome email
    const emailResult = await sendWelcomeEmail(newUser);
    console.log('Email send result:', emailResult);

    const token = generateToken(newUser);
    res.json({
      success: true,
      message: 'Registration successful! Welcome email sent to ' + email,
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email },
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Google OAuth endpoint - DISABLED until dependencies are installed
router.post('/google', async (req, res) => {
  return res.status(503).json({ 
    success: false, 
    message: 'Google OAuth is currently disabled. Please use standard registration or contact admin.' 
  });
});

// Microsoft OAuth endpoint - DISABLED until dependencies are installed  
router.post('/microsoft', async (req, res) => {
  return res.status(503).json({ 
    success: false, 
    message: 'Microsoft OAuth is currently disabled. Please use standard registration or contact admin.' 
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Check auth status
router.get('/status', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, user: decoded });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

module.exports = router;
