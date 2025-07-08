import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { User, Bell, Lock, BadgeHelp as Help, LogOut } from 'lucide-react-native';

export default function SettingsTab() {
  const { state, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileAvatar}>
          <User size={32} color="#607D8B" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{state.user?.name}</Text>
          <Text style={styles.profilePhone}>{state.user?.phoneNumber}</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        {renderSettingItem(
          <Bell size={24} color="#757575" />,
          'Notifications',
          'Messages, group & call tones'
        )}
        {renderSettingItem(
          <Lock size={24} color="#757575" />,
          'Privacy',
          'Block contacts, disappearing messages'
        )}
        {renderSettingItem(
          <Help size={24} color="#757575" />,
          'Help',
          'Help center, contact us, privacy policy'
        )}
        {renderSettingItem(
          <LogOut size={24} color="#F44336" />,
          'Logout',
          undefined,
          handleLogout
        )}
      </View>
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 16,
    color: '#757575',
  },
  settingsSection: {
    paddingTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
});