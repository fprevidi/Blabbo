import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ChatState, Chat, Message, Contact } from '../types';
import { apiService } from '../services/api';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';
import { encryptMessageForRecipient } from '../utils/encryption';
import { decryptMessageFromSender } from '../utils/encryption';



interface ChatContextType {
  state: ChatState;
  loadChats: () => Promise<void>;
  loadChatMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, type: string) => Promise<void>;
  createChat: (participants: string[], isGroup: boolean, name?: string) => Promise<void>;
  loadContacts: () => Promise<void>;
  setCurrentChat: (chat: Chat | null) => void;
  markMessageAsRead: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_CURRENT_CHAT'; payload: Chat | null }
  | { type: 'SET_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'UPDATE_CHAT'; payload: Chat };

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
      const message = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [message.chatId]: [
            ...(state.messages[message.chatId] || []),
            message,
          ],
        },
      };
    case 'UPDATE_MESSAGE':
      const updatedMessage = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [updatedMessage.chatId]: state.messages[updatedMessage.chatId]?.map(msg =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          ) || [],
        },
      };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'UPDATE_CHAT':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.id ? action.payload : chat
        ),
      };
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
      // Update message delivery status
      Object.keys(state.messages).forEach(chatId => {
        const message = state.messages[chatId]?.find(msg => msg.id === messageId);
        if (message) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { ...message, isDelivered: true },
          });
        }
      });
    });

    socketService.on('message-read', (messageId: string) => {
      // Update message read status
      Object.keys(state.messages).forEach(chatId => {
        const message = state.messages[chatId]?.find(msg => msg.id === messageId);
        if (message) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { ...message, isRead: true },
          });
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
      rawMessages.map(async (msg) => {
        try {
          const decrypted = await decryptMessageFromSender({
            ciphertext: msg.content,
            nonce: msg.nonce,
            senderPublicKey: msg.senderPublicKey,
          });

          return {
            ...msg,
            content: decrypted,
          };
        } catch (err) {
          console.error('Errore nella decifratura di un messaggio:', err);
          return msg; // fallback: lascialo cifrato
        }
      })
    );

    dispatch({ type: 'SET_MESSAGES', payload: { chatId, messages: decryptedMessages } });
  } catch (error) {
    console.error('Error loading chat messages:', error);
  }
};


 const sendMessage = async (chatId: string, content: string, type: string) => {
  try {
    // ottieni l'id del destinatario (assumo che sia un'altra persona nella chat)
    const chat = chats.find((c) => c._id === chatId);
    if (!chat) throw new Error('Chat non trovata');

    const recipientId = chat.members.find((id) => id !== authState.user?.id);
    if (!recipientId) throw new Error('Destinatario non trovato');

    // cifra il contenuto
    const encrypted = await encryptMessageForRecipient(recipientId, content);

    const message = await apiService.sendMessage(chatId, {
      content: encrypted.ciphertext,
      type,
      senderId: authState.user?.id,
      nonce: encrypted.nonce,
      senderPublicKey: encrypted.senderPublicKey,
    });

    socketService.sendMessage(message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
socketService.on('receiveMessage', async (messageData) => {
  try {
    const decryptedContent = await decryptMessageFromSender({
      ciphertext: messageData.content,
      nonce: messageData.nonce,
      senderPublicKey: messageData.senderPublicKey,
    });

    const message = {
      ...messageData,
      content: decryptedContent,
    };

    // Inserisci il messaggio nello stato (es: appendMessages(message))
    appendMessageToChat(message);
  } catch (error) {
    console.error('Errore nella decifratura del messaggio ricevuto:', error);
  }
});


  const createChat = async (participants: string[], isGroup: boolean, name?: string) => {
    try {
      const chat = await apiService.createChat(participants, isGroup, name);
      dispatch({ type: 'SET_CHATS', payload: [...state.chats, chat] });
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const contacts = await apiService.getContacts();
      dispatch({ type: 'SET_CONTACTS', payload: contacts });
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const setCurrentChat = (chat: Chat | null) => {
    dispatch({ type: 'SET_CURRENT_CHAT', payload: chat });
    if (chat) {
      socketService.joinChat(chat.id);
      loadChatMessages(chat.id);
    }
  };

  const markMessageAsRead = (messageId: string) => {
    socketService.markMessageAsRead(messageId);
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