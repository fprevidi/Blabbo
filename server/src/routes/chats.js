const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all chats for a user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userId,
      isActive: true,
    })
    .populate('participants', 'name avatar phoneNumber isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    const formattedChats = chats.map(chat => ({
      id: chat._id,
      type: chat.type,
      name: chat.type === 'group' ? chat.name : chat.participants.find(p => p._id.toString() !== req.userId)?.name,
      avatar: chat.avatar,
      participants: chat.participants.map(p => p._id.toString()),
      lastMessage: chat.lastMessage,
      unreadCount: 0, // Will be calculated based on messages
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      isGroup: chat.type === 'group',
      groupAdmin: chat.admin,
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new chat
router.post('/', auth, [
  body('participants').isArray({ min: 1 }),
  body('isGroup').isBoolean(),
  body('name').optional().isLength({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participants, isGroup, name } = req.body;

    // Add current user to participants if not already included
    if (!participants.includes(req.userId)) {
      participants.push(req.userId);
    }

    // For individual chats, check if chat already exists
    if (!isGroup && participants.length === 2) {
      const existingChat = await Chat.findOne({
        type: 'individual',
        participants: { $all: participants, $size: 2 },
      });

      if (existingChat) {
        return res.json({
          id: existingChat._id,
          type: existingChat.type,
          name: existingChat.name,
          avatar: existingChat.avatar,
          participants: existingChat.participants,
          isGroup: existingChat.type === 'group',
          groupAdmin: existingChat.admin,
        });
      }
    }

    // Create new chat
    const chat = new Chat({
      type: isGroup ? 'group' : 'individual',
      name: isGroup ? name : undefined,
      participants,
      admin: isGroup ? req.userId : undefined,
    });

    await chat.save();
    await chat.populate('participants', 'name avatar phoneNumber isOnline lastSeen');

    res.status(201).json({
      id: chat._id,
      type: chat.type,
      name: chat.name,
      avatar: chat.avatar,
      participants: chat.participants.map(p => p._id.toString()),
      isGroup: chat.type === 'group',
      groupAdmin: chat.admin,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant in the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({
      chatId,
      isDeleted: false,
    })
    .populate('senderId', 'name avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const formattedMessages = messages.reverse().map(message => ({
      id: message._id,
      senderId: message.senderId._id,
      recipientId: chat.type === 'individual' ? chat.participants.find(p => p.toString() !== message.senderId._id.toString()) : undefined,
      chatId: message.chatId,
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      isRead: message.readBy.some(read => read.userId.toString() === req.userId),
      isDelivered: message.deliveredTo.some(delivered => delivered.userId.toString() === req.userId),
      replyTo: message.replyTo?._id,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      audioDuration: message.audioDuration,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send a message
router.post('/:chatId/messages', auth, [
  body('content').isLength({ min: 1 }),
  body('type').isIn(['text', 'image', 'video', 'audio', 'document']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { content, type, fileUrl, fileName, fileSize, audioDuration, replyTo } = req.body;

    // Check if user is participant in the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Create message
    const message = new Message({
      chatId,
      senderId: req.userId,
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
      audioDuration,
      replyTo,
    });

    await message.save();
    await message.populate('senderId', 'name avatar');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    const formattedMessage = {
      id: message._id,
      senderId: message.senderId._id,
      chatId: message.chatId,
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      isRead: false,
      isDelivered: false,
      replyTo: message.replyTo,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      audioDuration: message.audioDuration,
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark message as read
router.put('/messages/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant in the chat
    const chat = await Chat.findOne({
      _id: message.chatId,
      participants: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add user to readBy array if not already present
    if (!message.readBy.some(read => read.userId.toString() === req.userId)) {
      message.readBy.push({
        userId: req.userId,
        readAt: new Date(),
      });
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;