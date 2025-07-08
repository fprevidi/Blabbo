const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all contacts for a user
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({
      userId: req.userId,
      isBlocked: false,
    })
    .populate('contactUserId', 'name avatar phoneNumber isOnline lastSeen')
    .sort({ name: 1 });

    const formattedContacts = contacts.map(contact => ({
      id: contact.contactUserId._id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      avatar: contact.contactUserId.avatar,
      isRegistered: true,
      isOnline: contact.contactUserId.isOnline,
      lastSeen: contact.contactUserId.lastSeen,
    }));

    res.json(formattedContacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Sync contacts from phone
router.post('/sync', auth, [
  body('contacts').isArray(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contacts } = req.body;
    const syncedContacts = [];

    for (const contactData of contacts) {
      const { name, phoneNumber } = contactData;

      // Find user by phone number
      const registeredUser = await User.findOne({ phoneNumber });
      
      if (registeredUser && registeredUser._id.toString() !== req.userId) {
        // Check if contact already exists
        const existingContact = await Contact.findOne({
          userId: req.userId,
          contactUserId: registeredUser._id,
        });

        if (!existingContact) {
          // Create new contact
          const contact = new Contact({
            userId: req.userId,
            contactUserId: registeredUser._id,
            name,
            phoneNumber,
          });

          await contact.save();
          
          syncedContacts.push({
            id: registeredUser._id,
            name,
            phoneNumber,
            avatar: registeredUser.avatar,
            isRegistered: true,
            isOnline: registeredUser.isOnline,
            lastSeen: registeredUser.lastSeen,
          });
        } else {
          // Update existing contact name if different
          if (existingContact.name !== name) {
            existingContact.name = name;
            await existingContact.save();
          }
        }
      }
    }

    res.json({
      message: 'Contacts synced successfully',
      syncedContacts,
    });
  } catch (error) {
    console.error('Sync contacts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add contact manually
router.post('/', auth, [
  body('phoneNumber').isMobilePhone(),
  body('name').isLength({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, name } = req.body;

    // Find user by phone number
    const registeredUser = await User.findOne({ phoneNumber });
    
    if (!registeredUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (registeredUser._id.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot add yourself as contact' });
    }

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      userId: req.userId,
      contactUserId: registeredUser._id,
    });

    if (existingContact) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    // Create new contact
    const contact = new Contact({
      userId: req.userId,
      contactUserId: registeredUser._id,
      name,
      phoneNumber,
    });

    await contact.save();

    res.status(201).json({
      id: registeredUser._id,
      name,
      phoneNumber,
      avatar: registeredUser.avatar,
      isRegistered: true,
      isOnline: registeredUser.isOnline,
      lastSeen: registeredUser.lastSeen,
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete contact
router.delete('/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findOne({
      userId: req.userId,
      contactUserId: contactId,
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await contact.deleteOne();

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Block/unblock contact
router.put('/:contactId/block', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { isBlocked } = req.body;

    const contact = await Contact.findOne({
      userId: req.userId,
      contactUserId: contactId,
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    contact.isBlocked = isBlocked;
    await contact.save();

    res.json({ message: `Contact ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
  } catch (error) {
    console.error('Block contact error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;