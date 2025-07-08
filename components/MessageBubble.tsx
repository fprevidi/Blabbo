import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Message } from '../types';
import { Check, CheckCheck } from 'lucide-react-native';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onPress?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onPress,
}) => {
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessageStatus = () => {
    if (!isOwn) return null;

    if (message.isRead) {
      return <CheckCheck size={16} color="#4FC3F7" />;
    } else if (message.isDelivered) {
      return <CheckCheck size={16} color="#9E9E9E" />;
    } else {
      return <Check size={16} color="#9E9E9E" />;
    }
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[
        styles.bubble,
        isOwn ? styles.ownBubble : styles.otherBubble,
      ]}>
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : styles.otherMessageText,
        ]}>
          {message.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timeText,
            isOwn ? styles.ownTimeText : styles.otherTimeText,
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          {renderMessageStatus()}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 8,
  },
  bubble: {
    maxWidth: '80%',
    padding: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  ownBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#303030',
  },
  otherMessageText: {
    color: '#303030',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    opacity: 0.7,
  },
  ownTimeText: {
    color: '#303030',
  },
  otherTimeText: {
    color: '#606060',
  },
});