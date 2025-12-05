/**
 * User Routes
 * Handles user registration, onboarding, and NST access verification
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get or create user profile
router.get('/:clerkId', async (req, res) => {
  try {
    let user = await User.findOne({ clerkId: req.params.clerkId });
    
    if (!user) {
      // User doesn't exist yet - will be created on onboarding
      return res.json({ 
        success: true, 
        user: null, 
        needsOnboarding: true 
      });
    }
    
    res.json({ 
      success: true, 
      user,
      needsOnboarding: !user.onboardingComplete
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/update user with onboarding data
router.post('/onboarding', async (req, res) => {
  try {
    const { clerkId, email, username, interests, college } = req.body;
    
    if (!clerkId || !email) {
      return res.status(400).json({ success: false, error: 'clerkId and email required' });
    }
    
    // Check if user exists
    let user = await User.findOne({ clerkId });
    
    if (user) {
      // Update existing user
      user.interests = interests || user.interests;
      user.college = college || user.college;
      user.onboardingComplete = true;
      await user.save();
    } else {
      // Create new user
      user = new User({
        clerkId,
        email,
        username,
        interests: interests || [],
        college,
        onboardingComplete: true
      });
      await user.save();
    }
    
    res.json({ 
      success: true, 
      user,
      isNstVerified: user.isNstVerified
    });
  } catch (error) {
    console.error('Error saving onboarding:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if user can access NST
router.get('/:clerkId/can-access-nst', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    
    if (!user) {
      return res.json({ 
        success: true, 
        canAccess: false, 
        reason: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      canAccess: user.isNstVerified,
      reason: user.isNstVerified ? 'Verified NST student' : 'Email not from NST domain'
    });
  } catch (error) {
    console.error('Error checking NST access:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quick check by email (for frontend before user is created)
router.post('/check-nst-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email required' });
    }
    
    const isNstEmail = email.endsWith('@nst.rishihood.edu.in');
    
    res.json({ 
      success: true, 
      isNstEmail,
      message: isNstEmail 
        ? 'You have access to NST learning features!' 
        : 'NST features require a @nst.rishihood.edu.in email'
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
