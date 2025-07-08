import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatListItem } from '@/components/ChatListItem';
import { Chat } from '@/types';

export default function ChatsTab() {
  const router = useRouter();
  const { state: chatState, loadChats } = useChat();
  const { state: authState } = useAuth();

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadChats();
    }
  }, [authState.isAuthenticated]);

  const handleChatPress = (chat: Chat) => {
    router.push({
      pathname: '/chat',
      params: { chatId: chat.id },
    });
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <ChatListItem
      chat={item}
      onPress={() => handleChatPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No chats yet</Text>
      <Text style={styles.emptySubtext}>
        Start a conversation with your contacts
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>
      
      <FlatList
        data={chatState.chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        refreshControl={
          <RefreshControl
            refreshing={chatState.isLoading}
            onRefresh={loadChats}
            colors={['#25D366']}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
  },
  chatList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});