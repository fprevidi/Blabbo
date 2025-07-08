const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

const socketHandlers = (io, socket) => {
  // Authentication
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        socket.emit('auth-error', 'Invalid token');
        return;
      }

      socket.userId = user._id.toString();
      socket.user = user;
      
      // Update user online status
      user.isOnline = true;
      user.socketId = socket.id;
      await user.save();
      
      // Broadcast user online status to contacts
      socket.broadcast.emit('user-online', {
        id: user._id,
        isOnline: true,
      });
      
      socket.emit('authenticated', { userId: user._id });
    } catch (error) {
      socket.emit('auth-error', 'Authentication failed');
    }
  });

  // Join chat room
  socket.on('join-chat', async (chatId) => {
    try {
      if (!socket.userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }

      // Verify user is participant in the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.userId,
      });

      if (!chat) {
        socket.emit('error', 'Chat not found');
        return;
      }

      socket.join(chatId);
      socket.currentChatId = chatId;
      
      // Mark messages as delivered
      await Message.updateMany(
        {
          chatId,
          senderId: { $ne: socket.userId },
          'deliveredTo.userId': { $ne: socket.userId },
        },
        {
          $addToSet: {
            deliveredTo: {
              userId: socket.userId,
              deliveredAt: new Date(),
            },
          },
        }
      );
    } catch (error) {
      socket.emit('error', 'Failed to join chat');
    }
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    socket.currentChatId = null;
  });

  // Send message
  socket.on('send-message', async (messageData) => {
    try {
      if (!socket.userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }

      const { chatId, content, type, fileUrl, fileName, fileSize, audioDuration, replyTo } = messageData;

      // Verify user is participant in the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: socket.userId,
      });

      if (!chat) {
        socket.emit('error', 'Chat not found');
        return;
      }

      // Create message
      const message = new Message({
        chatId,
        senderId: socket.userId,
        content,
        type: type || 'text',
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

      // Emit to all participants in the chat
      io.to(chatId).emit('message', formattedMessage);

      // Send push notification to offline users
      // (Implementation depends on your push notification service)
      
    } catch (error) {
      socket.emit('error', 'Failed to send message');
    }
  });

  // Mark message as read
  socket.on('mark-read', async (messageId) => {
    try {
      if (!socket.userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }

      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', 'Message not found');
        return;
      }

      // Add user to readBy array if not already present
      if (!message.readBy.some(read => read.userId.toString() === socket.userId)) {
        message.readBy.push({
          userId: socket.userId,
          readAt: new Date(),
        });
        await message.save();
      }

      // Emit read receipt to sender
      socket.to(message.chatId).emit('message-read', messageId);
    } catch (error) {
      socket.emit('error', 'Failed to mark message as read');
    }
  });

  // Typing indicators
  socket.on('typing', (chatId) => {
    if (socket.userId) {
      socket.to(chatId).emit('typing', {
        userId: socket.userId,
        chatId,
      });
    }
  });

  socket.on('stop-typing', (chatId) => {
    if (socket.userId) {
      socket.to(chatId).emit('stop-typing', {
        userId: socket.userId,
        chatId,
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    if (socket.userId) {
      try {
        // Update user offline status
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          user.socketId = null;
          await user.save();
          
          // Broadcast user offline status
          socket.broadcast.emit('user-offline', {
            id: user._id,
            isOnline: false,
            lastSeen: user.lastSeen,
          });
        }
      } catch (error) {
        console.error('Error updating user offline status:', error);
      }
    }
  });
};

module.exports = socketHandlers;