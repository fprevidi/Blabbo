// types/index.ts

// types/index.ts

export interface User {
  id: string;
  name: string;
  avatar?: string;
  phoneNumber: string;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  nonce?: string;
  senderPublicKey?: string;
}

export interface Chat {
  _id: string;
  type: 'individual' | 'group';
  name?: string;
  avatar?: string;
  participants: string[];
  admin?: string;
  lastMessage?: Message;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  isRegistered: boolean;
  userId?: string; // se è registrato e ha account
}

export interface ChatState {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  contacts: Contact[];
}
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}
