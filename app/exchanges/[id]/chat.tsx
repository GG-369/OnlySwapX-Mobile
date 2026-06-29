import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Mic, Play, Send, Square } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { messageService } from '@/services/messageService';
import { MessageResponse } from '@/types';
import { Button, Card, LoadingState, colors } from '@/components/ui';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { formatDate, readableError } from '@/utils/format';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const recorder = useVoiceRecorder();
  const listRef = useRef<FlatList<MessageResponse>>(null);
  const exchangeId = Number(id);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!exchangeId) return;
    try {
      setMessages(await messageService.getByExchange(exchangeId));
    } catch (error) {
      if (!silent) Alert.alert('No se cargó el chat', readableError(error, 'Intenta nuevamente.'));
    } finally {
      setLoading(false);
    }
  }, [exchangeId]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5000);
    return () => clearInterval(interval);
  }, [load]);

  const sendText = async () => {
    const text = content.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const sent = await messageService.send({ exchangeId, content: text, messageType: 'TEXT' });
      setMessages((prev) => [...prev, sent]);
      setContent('');
    } catch (error) {
      Alert.alert('No se envió el mensaje', readableError(error, 'Intenta nuevamente.'));
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    try {
      if (recorder.isRecording) {
        await recorder.stopRecording();
      } else {
        await recorder.startRecording();
      }
    } catch (error) {
      Alert.alert('Micrófono no disponible', error instanceof Error ? error.message : 'No se pudo usar el micrófono.');
    }
  };

  const sendVoice = async () => {
    if (!recorder.recordingUri || sending) return;

    setSending(true);
    try {
      const sent = await messageService.send({
        exchangeId,
        content: recorder.recordingUri,
        messageType: 'AUDIO',
      });
      setMessages((prev) => [...prev, sent]);
      recorder.clearRecording();
    } catch (error) {
      Alert.alert('No se envió la nota de voz', readableError(error, 'La grabación quedó lista para reintentar.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Exchange Chat</Text>
          <Text style={styles.subtitle}>Texto y notas de voz</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          const isAudio = item.messageType === 'AUDIO';
          return (
            <View style={[styles.messageRow, mine && styles.messageRowMine]}>
              <Card style={[styles.bubble, mine && styles.bubbleMine]}>
                <Text style={styles.sender}>{mine ? 'Tú' : item.senderName}</Text>
                {isAudio ? (
                  <TouchableOpacity style={styles.audioButton} onPress={() => recorder.play(item.content)}>
                    <Play size={16} color={colors.background} />
                    <Text style={styles.audioText}>Reproducir nota de voz</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.messageText}>{item.content}</Text>
                )}
                <Text style={styles.messageDate}>{formatDate(item.createdAt)}</Text>
              </Card>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Aún no hay mensajes. Envía el primero.</Text>}
      />

      {recorder.recordingUri ? (
        <View style={styles.voicePreview}>
          <Text style={styles.voicePreviewText}>Nota de voz lista</Text>
          <Button label="Escuchar" icon={Play} variant="secondary" onPress={() => recorder.play()} loading={recorder.isPlaying} />
          <Button label="Enviar audio" icon={Send} onPress={sendVoice} loading={sending} />
        </View>
      ) : null}

      <View style={styles.composer}>
        <TouchableOpacity style={[styles.micButton, recorder.isRecording && styles.micRecording]} onPress={toggleRecording}>
          {recorder.isRecording ? <Square size={18} color={colors.background} /> : <Mic size={18} color={colors.background} />}
        </TouchableOpacity>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={recorder.isRecording ? 'Grabando nota de voz...' : 'Escribe un mensaje...'}
          placeholderTextColor="#64748b"
          style={styles.input}
          editable={!recorder.isRecording}
        />
        <TouchableOpacity style={[styles.sendButton, (!content.trim() || sending) && styles.disabled]} onPress={sendText} disabled={!content.trim() || sending}>
          <Send size={18} color={colors.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 14,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  messages: {
    gap: 10,
    padding: 20,
    paddingBottom: 24,
  },
  messageRow: {
    alignItems: 'flex-start',
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
  },
  bubbleMine: {
    backgroundColor: '#24314a',
    borderColor: 'rgba(250, 204, 21, 0.28)',
  },
  sender: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  messageText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  messageDate: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 8,
  },
  audioButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  audioText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.muted,
    marginTop: 40,
    textAlign: 'center',
  },
  voicePreview: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  voicePreviewText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  composer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  micButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  micRecording: {
    backgroundColor: '#fb7185',
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  disabled: {
    opacity: 0.45,
  },
});
