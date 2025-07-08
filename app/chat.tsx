import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { MessageBubble } from '@/components/MessageBubble';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { ArrowLeft, Send, Mic, Paperclip, Camera } from 'lucide-react-native';

export default function ChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { state: chatState, setCurrentChat, sendMessage, markMessageAsRead } = useChat();
  const { state: authState } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentChat = chatState.chats.find(chat => chat.id === chatId);
  const messages = chatState.messages[chatId || ''] || [];

  useEffect(() => {
    if (currentChat) {
      setCurrentChat(currentChat);
    }
  }, [currentChat]);

  useEffect(() => {
    // Mark messages as read when opening chat
    messages.forEach(message => {
      if (!message.isRead && message.senderId !== authState.user?.id) {
        markMessageAsRead(message.id);
      }
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId) return;

    try {
      await sendMessage(chatId, messageText.trim(), 'text');
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleVoiceMessage = async (audioUri: string, duration: number) => {
    if (!chatId) return;

    try {
      await sendMessage(chatId, `Voice message (${duration}s)`, 'audio');
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === authState.user?.id;
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={24} color="#FFFFFF" />
      </Pressable>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>{currentChat?.name}</Text>
        <Text style={styles.headerSubtitle}>
          {currentChat?.isGroup ? `${currentChat.participants.length} members` : 'Online'}
        </Text>
      </View>
    </View>
  );

  const renderInputArea = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputRow}>
        <Pressable style={styles.attachButton}>
          <Paperclip size={24} color="#757575" />
        </Pressable>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <Pressable style={styles.cameraButton}>
          <Camera size={24} color="#757575" />
        </Pressable>
        {messageText.trim() ? (
          <Pressable style={styles.sendButton} onPress={handleSendMessage}>
            <Send size={20} color="#FFFFFF" />
          </Pressable>
        ) : (
          <Pressable
            style={styles.micButton}
            onPress={() => setShowVoiceRecorder(true)}
          >
            <Mic size={20} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (!currentChat) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Chat not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
        
        {showVoiceRecorder ? (
          <VoiceMessageRecorder
            onSend={handleVoiceMessage}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        ) : (
          renderInputArea()
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingVertical: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  cameraButton: {
    padding: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 40,
  },
});