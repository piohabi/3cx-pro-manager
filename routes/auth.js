const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// OAuth clients
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
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

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
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
      return res.status(500).json({ success: false, message: 'Registration failed' });
    }

    const token = generateToken(newUser);
    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Google OAuth endpoint
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();

    if (error || !user) {
      // Create new user from Google account
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          username: email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5),
          email,
          google_id: googleId,
          full_name: name,
          avatar_url: picture,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Google user creation error:', createError);
        return res.status(500).json({ success: false, message: 'Failed to create user' });
      }
      user = newUser;
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
});

// Microsoft OAuth endpoint
router.post('/microsoft', async (req, res) => {
  try {
    const { accessToken } = req.body;

    // Get user info from Microsoft Graph API
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { id: microsoftId, mail: email, displayName, userPrincipalName } = response.data;

    // Check if user exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('microsoft_id', microsoftId)
      .single();

    if (error || !user) {
      // Create new user from Microsoft account
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          username: (email || userPrincipalName).split('@')[0] + '_' + Math.random().toString(36).substr(2, 5),
          email: email || userPrincipalName,
          microsoft_id: microsoftId,
          full_name: displayName,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('Microsoft user creation error:', createError);
        return res.status(500).json({ success: false, message: 'Failed to create user' });
      }
      user = newUser;
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    res.status(500).json({ success: false, message: 'Microsoft authentication failed' });
  }
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
