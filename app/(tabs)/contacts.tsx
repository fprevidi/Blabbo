import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Contact } from '@/types';
import { Users, MessageCircle, Plus } from 'lucide-react-native';

export default function ContactsTab() {
  const router = useRouter();
  const { state: chatState, loadContacts, createChat } = useChat();
  const { state: authState } = useAuth();

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadContacts();
    }
  }, [authState.isAuthenticated]);

  const handleContactPress = async (contact: Contact) => {
    if (!contact.isRegistered) {
      Alert.alert('Contact not registered', 'This contact is not using Blabbo');
      return;
    }

    try {
      const chat = await createChat([contact.id], false);
      if (chat) {
        router.push({
          pathname: '/chat',
          params: { chatId: chat.id },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create chat');
    }
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <Pressable
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.contactActions}>
        {item.isRegistered ? (
          <MessageCircle size={20} color="#25D366" />
        ) : (
          <Text style={styles.inviteText}>Invite</Text>
        )}
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Users size={60} color="#E0E0E0" />
      <Text style={styles.emptyText}>No contacts found</Text>
      <Text style={styles.emptySubtext}>
        Add contacts to start chatting
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <Pressable style={styles.addButton}>
          <Plus size={24} color="#25D366" />
        </Pressable>
      </View>
      
      <FlatList
        data={chatState.contacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        style={styles.contactList}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    padding: 8,
  },
  contactList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#607D8B',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: '#757575',
  },
  contactActions: {
    paddingLeft: 8,
  },
  inviteText: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '600',
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});