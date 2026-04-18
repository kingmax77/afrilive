import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { MOCK_CHAT_MESSAGES } from '../constants/mockData';

const EXTRA_MESSAGES = [
  { id: 'x1', user: 'FashionKing', text: 'Do you ship to Kano? 📦' },
  { id: 'x2', user: 'Chiamaka_B', text: '❤️❤️❤️ obsessed with this color' },
  { id: 'x3', user: 'AdamsBello', text: 'Just bought! Excited 🙌' },
  { id: 'x4', user: 'ShopQueen', text: 'How long is delivery?' },
  { id: 'x5', user: 'NaijaFash', text: 'Price is too reasonable 😭' },
  { id: 'x6', user: 'BuyerLagos', text: 'Can I get XL size?' },
  { id: 'x7', user: 'GhanaGirl', text: 'Adding to cart now 🛒' },
];

const ChatBubble = ({ message, isNew }) => {
  const opacity = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (isNew) {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, []);

  return (
    <Animated.View style={[styles.bubble, { opacity }]}>
      <Text style={styles.bubbleUser}>{message.user}</Text>
      <Text style={styles.bubbleText}>{message.text}</Text>
    </Animated.View>
  );
};

export default function ChatOverlay({ userName }) {
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES.slice(0, 5));
  const [inputText, setInputText] = useState('');
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const listRef = useRef(null);
  const autoMessageIndex = useRef(0);

  useEffect(() => {
    // Auto-add simulated chat messages
    const interval = setInterval(() => {
      const available = [...MOCK_CHAT_MESSAGES.slice(5), ...EXTRA_MESSAGES];
      const msg = available[autoMessageIndex.current % available.length];
      const newMsg = { ...msg, id: `auto_${Date.now()}` };
      autoMessageIndex.current++;

      setMessages((prev) => {
        const updated = [...prev.slice(-20), newMsg];
        setNewMessageIds((ids) => new Set([...ids, newMsg.id]));
        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const msg = {
      id: `user_${Date.now()}`,
      user: userName || 'You',
      text: inputText.trim(),
      isOwn: true,
    };
    setMessages((prev) => [...prev.slice(-20), msg]);
    setNewMessageIds((ids) => new Set([...ids, msg.id]));
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages.slice(-12)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble message={item} isNew={newMessageIds.has(item.id)} />
        )}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        inverted={false}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Say something..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={18} color={COLORS.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  messageList: {
    maxHeight: 220,
  },
  messageContent: {
    paddingHorizontal: 4,
    gap: 4,
  },
  bubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 4,
    paddingVertical: 2,
  },
  bubbleUser: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  bubbleText: {
    color: COLORS.white,
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    height: 38,
  },
  sendBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
