# WhatsApp Clone - Full Stack Application

A complete WhatsApp clone built with React Native (Expo) and Node.js, featuring real-time messaging, voice messages, group chats, and more.

## Features

### Frontend (React Native/Expo)
- **Authentication**: Phone number verification with OTP
- **Real-time Messaging**: Text, images, videos, audio, and documents
- **Voice Messages**: Record and play voice messages
- **Group Chats**: Create and manage group conversations
- **Contact Management**: Sync and manage contacts
- **Message Indicators**: Delivery and read receipts
- **Online Status**: See when contacts are online
- **Push Notifications**: Receive notifications for new messages
- **Modern UI**: Clean, WhatsApp-inspired design

### Backend (Node.js)
- **REST API**: Complete API for all app functionality
- **Real-time Communication**: WebSocket support with Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **File Upload**: Cloudinary integration for media files
- **SMS Integration**: Twilio for OTP verification
- **Security**: Rate limiting, CORS, and security headers

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- Expo Router (file-based routing)
- Socket.IO Client
- Async Storage
- Expo AV (audio/video)
- Lucide React Native (icons)

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose
- JWT Authentication
- Twilio (SMS)
- Cloudinary (file storage)
- Bcrypt (password hashing)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Expo CLI
- Twilio Account (for SMS)
- Cloudinary Account (for file uploads)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
- MongoDB connection string
- Twilio credentials
- Cloudinary credentials
- JWT secret

5. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm run dev
```

3. Open the app on your device using Expo Go or run on simulator

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Chats
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message
- `PUT /api/messages/:id/read` - Mark message as read

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Add new contact
- `POST /api/contacts/sync` - Sync phone contacts
- `DELETE /api/contacts/:id` - Delete contact

### Upload
- `POST /api/upload` - Upload file
- `DELETE /api/upload/:publicId` - Delete file

## Socket Events

### Client to Server
- `join-chat` - Join chat room
- `leave-chat` - Leave chat room
- `send-message` - Send message
- `mark-read` - Mark message as read
- `typing` - Start typing indicator
- `stop-typing` - Stop typing indicator

### Server to Client
- `message` - New message received
- `user-online` - User came online
- `user-offline` - User went offline
- `message-delivered` - Message delivered
- `message-read` - Message read
- `typing` - User is typing
- `stop-typing` - User stopped typing

## Database Schema

### User
- Phone number (unique)
- Name
- Avatar
- About/Status
- Online status
- Last seen
- OTP verification data

### Chat
- Type (individual/group)
- Name (for groups)
- Participants
- Admin (for groups)
- Last message
- Timestamps

### Message
- Chat ID
- Sender ID
- Content
- Type (text/image/video/audio/document)
- File data
- Delivery/read status
- Reply to message
- Timestamps

### Contact
- User ID
- Contact User ID
- Name
- Phone number
- Block status

## Deployment

### Backend Deployment
1. Deploy to platforms like Heroku, Railway, or DigitalOcean
2. Set up MongoDB Atlas for database
3. Configure environment variables
4. Set up Cloudinary for file storage
5. Configure Twilio for SMS

### Frontend Deployment
1. Build the app for production:
```bash
expo build
```

2. Deploy to app stores or use Expo's hosted service

## Development Notes

### Environment Variables
Make sure to set up all required environment variables in production:
- Database connection strings
- API keys for third-party services
- JWT secrets
- CORS origins

### Security Considerations
- Use strong JWT secrets
- Implement rate limiting
- Validate all inputs
- Use HTTPS in production
- Implement proper error handling

### Performance Optimization
- Implement message pagination
- Use database indexes
- Optimize image/video uploads
- Implement caching where appropriate

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email your-email@example.com or create an issue in the GitHub repository.