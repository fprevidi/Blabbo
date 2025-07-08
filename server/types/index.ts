export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
  about?: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId?: string;
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  timestamp: Date;
  isRead: boolean;
  isDelivered: boolean;
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  audioDuration?: number;
}

export interface Chat {
  id: string;
  type: 'individual' | 'group';
  name?: string;
  avatar?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  isGroup: boolean;
  groupAdmin?: string;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  isRegistered: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  isLoading: boolean;
  contacts: Contact[];
}