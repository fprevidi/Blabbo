import React, { useState } from 'react';
import { router } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle } from 'lucide-react-native';

export default function AuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const { sendOTP, verifyOTP, registerUser, state } = useAuth();

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      await sendOTP(phoneNumber);
      setStep('otp');
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await verifyOTP(phoneNumber, otp);
      setStep('register');
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      await registerUser({ name });
      router.replace('/chat');

    } catch (error) {
      Alert.alert('Error', 'Failed to register. Please try again.');
    }
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Enter your phone number</Text>
      <Text style={styles.subtitle}>
        We'll send you a verification code to confirm your number
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="+1 (555) 123-4567"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        autoFocus
      />
      
      <Pressable
        style={[styles.button, { opacity: phoneNumber ? 1 : 0.5 }]}
        onPress={handleSendOTP}
        disabled={!phoneNumber || state.isLoading}
      >
        <Text style={styles.buttonText}>
          {state.isLoading ? 'Sending...' : 'Send OTP'}
        </Text>
      </Pressable>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Enter verification code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {phoneNumber}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="123456"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        autoFocus
      />
      
      <Pressable
        style={[styles.button, { opacity: otp.length === 6 ? 1 : 0.5 }]}
        onPress={handleVerifyOTP}
        disabled={otp.length !== 6 || state.isLoading}
      >
        <Text style={styles.buttonText}>
          {state.isLoading ? 'Verifying...' : 'Verify'}
        </Text>
      </Pressable>
      
      <Pressable onPress={() => setStep('phone')} style={styles.backButton}>
        <Text style={styles.backButtonText}>Change number</Text>
      </Pressable>
    </View>
  );

  const renderRegisterStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>What's your name?</Text>
      <Text style={styles.subtitle}>
        This name will be visible to your contacts
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        autoFocus
      />
      
      <Pressable
        style={[styles.button, { opacity: name ? 1 : 0.5 }]}
        onPress={handleRegister}
        disabled={!name || state.isLoading}
      >
        <Text style={styles.buttonText}>
          {state.isLoading ? 'Creating account...' : 'Continue'}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MessageCircle size={60} color="#25D366" />
          <Text style={styles.appName}>Blabbo</Text>
        </View>

        {step === 'phone' && renderPhoneStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'register' && renderRegisterStep()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
  },
  stepContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#25D366',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#25D366',
    fontSize: 16,
  },
});