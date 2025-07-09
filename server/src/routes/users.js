const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /users/:userId/public-key
router.post('/:userId/public-key', async (req, res) => {
  const { userId } = req.params;
  const { publicKey } = req.body;

  if (!publicKey) {
    return res.status(400).json({ error: 'Missing publicKey' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { publicKey },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Public key saved successfully' });
  } catch (err) {
    console.error('Error saving public key:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// GET /users/:userId/public-key
router.get('/:userId/public-key', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select('publicKey');
    if (!user || !user.publicKey) {
      return res.status(404).json({ error: 'Public key not found' });
    }

    res.json({ publicKey: user.publicKey });
  } catch (err) {
    console.error('Error retrieving public key:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
