import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff, Send, X } from 'lucide-react-native';

interface VoiceMessageRecorderProps {
  onSend: (audioUri: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onSend,
  onCancel,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setIsRecording(false);
      setRecording(null);

      // Stop animations and timer
      pulseAnim.stopAnimation();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handleSend = () => {
    if (audioUri) {
      onSend(audioUri, recordingTime);
      reset();
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    reset();
    onCancel();
  };

  const reset = () => {
    setRecording(null);
    setIsRecording(false);
    setRecordingTime(0);
    setAudioUri(null);
    pulseAnim.setValue(1);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Message</Text>
        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <X size={24} color="#757575" />
        </Pressable>
      </View>

      <View style={styles.recordingContainer}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
        </View>

        <View style={styles.controlsContainer}>
          <Pressable
            onPress={handleCancel}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </Pressable>

          <Animated.View
            style={[
              styles.recordButton,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: isRecording ? '#F44336' : '#25D366',
              },
            ]}
          >
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              style={styles.recordButtonInner}
            >
              {isRecording ? (
                <MicOff size={32} color="#FFFFFF" />
              ) : (
                <Mic size={32} color="#FFFFFF" />
              )}
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={handleSend}
            style={[
              styles.actionButton,
              { opacity: audioUri ? 1 : 0.5 },
            ]}
            disabled={!audioUri}
          >
            <Send size={20} color="#25D366" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  cancelButton: {
    padding: 8,
  },
  recordingContainer: {
    alignItems: 'center',
  },
  timerContainer: {
    marginBottom: 30,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 200,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    minWidth: 60,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '600',
  },
});
