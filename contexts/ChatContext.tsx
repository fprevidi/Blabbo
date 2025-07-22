import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Chat, Message, Contact } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';
import { encryptMessageForRecipient, decryptMessageFromSender } from '../utils/encryption';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  contacts: Contact[];
  currentChat: Chat | null;
  isLoading: boolean;
}

interface ChatContextType {
  state: ChatState;
  loadChats: () => Promise<void>;
  loadChatMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, type: string) => Promise<void>;
  createChat: (participants: string[], isGroup: boolean, name?: string) => Promise<void>;
  loadContacts: () => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  markMessageAsRead: (messageId: string) => void;
   setContacts: (contacts: Contact[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_CURRENT_CHAT'; payload: Chat | null }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }
  | { type: 'SET_CONTACTS'; payload: Contact[] };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: [
            ...(state.messages[action.payload.chatId] || []),
            action.payload,
          ],
        },
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: state.messages[action.payload.chatId]?.map(msg =>
            msg._id === action.payload._id ? action.payload : msg
          ) || [],
        },
      };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    default:
      return state;
  }
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: authState } = useAuth();
  const [state, dispatch] = useReducer(chatReducer, {
    chats: [],
    currentChat: null,
    messages: {},
    isLoading: false,
    contacts: [],
  });

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadChats();
      loadContacts();
      setupSocketListeners();
    }
  }, [authState.isAuthenticated]);

  const setupSocketListeners = () => {
    socketService.on('message', (message: Message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socketService.on('message-delivered', (messageId: string) => {
      Object.keys(state.messages).forEach(chatId => {
        const message = state.messages[chatId]?.find(msg => msg._id === messageId);
        if (message) {
          dispatch({ type: 'UPDATE_MESSAGE', payload: { ...message, isDelivered: true } as Message });
        }
      });
    });

    socketService.on('message-read', (messageId: string) => {
      Object.keys(state.messages).forEach(chatId => {
        const message = state.messages[chatId]?.find(msg => msg._id === messageId);
        if (message) {
          dispatch({ type: 'UPDATE_MESSAGE', payload: { ...message, isRead: true } as Message });
        }
      });
    });
  };

  const loadChats = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const chats = await apiService.getChats();
      dispatch({ type: 'SET_CHATS', payload: chats });
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const rawMessages = await apiService.getChatMessages(chatId);

      const decryptedMessages = await Promise.all(
        rawMessages.map(async (msg: any) => {
          if (msg.nonce && msg.senderPublicKey) {
            try {
              const decrypted = await decryptMessageFromSender({
                ciphertext: msg.content,
                nonce: msg.nonce,
                senderPublicKey: msg.senderPublicKey,
              });
              return { ...msg, content: decrypted };
            } catch (err) {
              console.warn('Decryption failed:', err);
            }
          }
          return msg;
        })
      );

      dispatch({ type: 'SET_MESSAGES', payload: { chatId, messages: decryptedMessages } });
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (chatId: string, content: string, type: string) => {
    try {
      const chat = state.chats.find(c => c._id === chatId);
      if (!chat) throw new Error('Chat non trovata');

      const recipientId = chat.participants.find(id => id !== authState.user?._id);
      if (!recipientId) throw new Error('Destinatario non trovato');

      const encrypted = await encryptMessageForRecipient(recipientId, content);

      const message = await apiService.sendMessage(chatId, {
        content: encrypted.ciphertext,
        type,
        nonce: encrypted.nonce,
        senderPublicKey: encrypted.senderPublicKey,
      });

      socketService.sendMessage(message);
    } catch (error) {
      console.error('Errore invio messaggio:', error);
    }
  };

  const createChat = async (participants: string[], isGroup: boolean, name?: string) => {
    try {
      const chat = await apiService.createChat(participants, isGroup, name);
      dispatch({ type: 'SET_CHATS', payload: [...state.chats, chat] });
    } catch (error) {
      console.error('Errore creazione chat:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const contacts = await apiService.getContacts();
        console.log('📡 Risposta da /contacts:', contacts);
      dispatch({ type: 'SET_CONTACTS', payload: contacts });
    } catch (error) {
      console.error('Errore caricamento contatti:', error);
    }
  };

  const setCurrentChat = (chat: Chat | null) => {
    dispatch({ type: 'SET_CURRENT_CHAT', payload: chat });
    if (chat) {
      socketService.joinChat(chat._id);
      loadChatMessages(chat._id);
    }
  };

  const markMessageAsRead = (messageId: string) => {
    socketService.markMessageAsRead(messageId);
  };
const setContacts = (contacts: Contact[]) => {
  dispatch({ type: 'SET_CONTACTS', payload: contacts });
};

  const value: ChatContextType = {
    state,
    loadChats,
    loadChatMessages,
    sendMessage,
    createChat,
    loadContacts,
    setCurrentChat,
    markMessageAsRead,
    setContacts 
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};