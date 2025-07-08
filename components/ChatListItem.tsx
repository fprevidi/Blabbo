import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Chat } from '../types';
import { Users } from 'lucide-react-native';

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ chat, onPress }) => {
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return messageTime.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderAvatar = () => {
    if (chat.avatar) {
      return (
        <Image source={{ uri: chat.avatar }} style={styles.avatar} />
      );
    }
    
    return (
      <View style={styles.avatarPlaceholder}>
        {chat.isGroup ? (
          <Users size={24} color="#607D8B" />
        ) : (
          <Text style={styles.avatarText}>
            {chat.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {renderAvatar()}
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {chat.name || 'Unknown'}
          </Text>
          {chat.lastMessage && (
            <Text style={styles.time}>
              {formatTime(chat.lastMessage.timestamp)}
            </Text>
          )}
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage?.content || 'No messages yet'}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#607D8B',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#757575',
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});