import { io, Socket } from 'socket.io-client';
import { Message, User } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private listeners: { [event: string]: Function[] } = {};

  connect(token: string) {
    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('message', (message: Message) => {
      this.emit('message', message);
    });

    this.socket.on('user-online', (user: User) => {
      this.emit('user-online', user);
    });

    this.socket.on('user-offline', (user: User) => {
      this.emit('user-offline', user);
    });

    this.socket.on('message-delivered', (messageId: string) => {
      this.emit('message-delivered', messageId);
    });

    this.socket.on('message-read', (messageId: string) => {
      this.emit('message-read', messageId);
    });

    this.socket.on('typing', (data: { userId: string; chatId: string }) => {
      this.emit('typing', data);
    });

    this.socket.on('stop-typing', (data: { userId: string; chatId: string }) => {
      this.emit('stop-typing', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Message events
  sendMessage(message: Message) {
    if (this.socket) {
      this.socket.emit('send-message', message);
    }
  }

  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  markMessageAsRead(messageId: string) {
    if (this.socket) {
      this.socket.emit('mark-read', messageId);
    }
  }

  startTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('typing', chatId);
    }
  }

  stopTyping(chatId: string) {
    if (this.socket) {
      this.socket.emit('stop-typing', chatId);
    }
  }

  // Event listeners
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const socketService = new SocketService();