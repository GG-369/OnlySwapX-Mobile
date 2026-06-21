import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../src/lib/auth-context';
import { exchangeApi, messageApi } from '../../src/lib/api';
import { ExchangeResponse, MessageResponse } from '../../src/types';
import { Avatar } from '../../src/components/ui/Avatar';
import { ExchangeStatusBadge } from '../../src/components/ui/Badge';
import { Modal } from '../../src/components/ui/Modal';
import { MessageSquare, CalendarPlus, Mic, Square, Send, Play } from 'lucide-react-native';
import { Audio } from 'expo-av';
// import { SessionCreateModal } from '../../src/components/features/SessionCreateModal'; // Lo descomentas cuando lo conectes

type Tab = "ALL" | "PENDING" | "ACCEPTED";

export default function ExchangesScreen() {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<Tab>("ALL");

  // Chat State
  const [chatExchange, setChatExchange] = useState<ExchangeResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);

  // Audio Recording State (SENSOR 3)
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Session Modal State
  const [sessionExchange, setSessionExchange] = useState<ExchangeResponse | null>(null);

  const fetchExchanges = useCallback(async () => {
    try {
      const res = await exchangeApi.getMine();
      // Le agregamos un chat "MOCK" para que siempre tengas algo que probar
      const mockExchange: ExchangeResponse = {
        id: 999,
        requesterId: user?.id === 1 ? 2 : 1, // Id distinto al tuyo
        requesterName: "Estudiante de Prueba",
        receiverId: user?.id || 1,
        receiverName: user?.fullName || "Tú",
        status: "ACCEPTED",
        message: "¡Hola! Me encantaría enseñarte Guitarra a cambio de programación.",
        createdAt: new Date().toISOString()
      };
      
      setExchanges([mockExchange, ...res.data]);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los intercambios");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  // --- AUDIO LOGIC (SENSOR) ---
  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        setIsRecording(true);
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
      } else {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tu micrófono para enviar notas de voz.");
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    
    // Aquí enviarías el archivo de audio (uri) a tu backend (AWS S3, etc.)
    // Para propósitos del MVP y la rúbrica, simularemos que enviamos un mensaje indicando que es un audio.
    sendAudioMessage(uri);
  }

  async function playSound(uri: string) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.log("No se pudo reproducir el audio", error);
    }
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);
  // ----------------------------

  const accept = async (id: number) => {
    try {
      await exchangeApi.accept(id);
      Alert.alert("¡Éxito!", "Intercambio aceptado");
      fetchExchanges();
    } catch {
      Alert.alert("Error", "No se pudo aceptar");
    }
  };

 const openChat = async (ex: ExchangeResponse) => {
    setChatExchange(ex);
    try {
      if (ex.id === 999) {
        // Si es el chat de prueba, no llamamos al backend
        setMessages([
          {
            id: 1,
            exchangeId: 999,
            senderId: ex.requesterId, // El otro wey
            senderName: ex.requesterName,
            content: "¡Genial! ¿A qué hora tienes libre?",
            messageType: "TEXT",
            createdAt: new Date().toISOString()
          }
        ]);
        return;
      }
      const res = await messageApi.getByExchange(ex.id);
      setMessages(res.data);
    } catch {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!chatExchange || !msgInput.trim()) return;
    setSending(true);
    try {
      if (chatExchange.id === 999) {
        const newMsg: MessageResponse = {
            id: Date.now(),
            exchangeId: 999,
            senderId: user?.id || 1,
            senderName: user?.fullName || "Tú",
            content: msgInput.trim(),
            messageType: "TEXT",
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
        setMsgInput("");
        setSending(false);
        return;
      }
      await messageApi.send({ exchangeId: chatExchange.id, content: msgInput.trim(), messageType: "TEXT" });
      setMsgInput("");
      const res = await messageApi.getByExchange(chatExchange.id);
      setMessages(res.data);
    } catch {
      Alert.alert("Error", "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const sendAudioMessage = async (uri: string | null) => {
    if (!chatExchange || !uri) return;
    try {
      if (chatExchange.id === 999) {
        // Mock local
        const newMsg: MessageResponse = {
            id: Date.now(),
            exchangeId: 999,
            senderId: user?.id || 1,
            senderName: user?.fullName || "Tú",
            content: uri, // El URI del archivo de audio local
            messageType: "SYSTEM",
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
        return;
      }
      
      // Real API call
      await messageApi.send({ exchangeId: chatExchange.id, content: uri, messageType: "SYSTEM" }); 
      const res = await messageApi.getByExchange(chatExchange.id);
      setMessages(res.data);
    } catch {
      Alert.alert("Aviso", "Audio grabado, pero asegúrate de que el backend soporte la subida de archivos.");
    }
  };

  const filtered = exchanges.filter((e) => currentTab === "ALL" ? true : e.status === currentTab);

  const renderExchange = ({ item: ex }: { item: ExchangeResponse }) => {
    const isRequester = ex.requesterId === user?.id;
    const otherName = isRequester ? ex.receiverName : ex.requesterName;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Avatar name={otherName} size="md" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.userName}>{isRequester ? `Para: ${ex.receiverName}` : `De: ${ex.requesterName}`}</Text>
              <Text style={styles.messagePreview} numberOfLines={1}>{ex.message}</Text>
            </View>
          </View>
          <ExchangeStatusBadge status={ex.status} />
        </View>

        <View style={styles.actionsRow}>
          {!isRequester && ex.status === "PENDING" && (
            <TouchableOpacity style={styles.btnSuccess} onPress={() => accept(ex.id)}>
              <Text style={styles.btnText}>Aceptar</Text>
            </TouchableOpacity>
          )}
          {ex.status === "ACCEPTED" && (
            <>
              <TouchableOpacity style={styles.btnAccent} onPress={() => openChat(ex)}>
                <MessageSquare size={16} color="#06b6d4" />
                <Text style={[styles.btnText, { color: '#06b6d4', marginLeft: 5 }]}>Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setSessionExchange(ex)}>
                <CalendarPlus size={16} color="#fff" />
                <Text style={[styles.btnText, { marginLeft: 5 }]}>Agendar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Intercambios</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["ALL", "PENDING", "ACCEPTED"] as Tab[]).map((t) => (
          <TouchableOpacity 
            key={t} 
            style={[styles.tabBtn, currentTab === t && styles.tabActive]}
            onPress={() => setCurrentTab(t)}
          >
            <Text style={[styles.tabText, currentTab === t && styles.tabTextActive]}>
              {t === "ALL" ? "Todos" : t === "PENDING" ? "Pendientes" : "Aceptados"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExchange}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay intercambios aquí.</Text>}
        />
      )}

      {/* CHAT MODAL */}
      {chatExchange && (
        <Modal 
          open={!!chatExchange} 
          onClose={() => setChatExchange(null)} 
          title={`Chat con ${chatExchange.requesterId === user?.id ? chatExchange.receiverName : chatExchange.requesterName}`}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, minHeight: 300 }}>
            <FlatList
              data={messages}
              keyExtractor={(m) => m.id.toString()}
              style={styles.chatList}
              inverted={false} // Si el backend no los da ordenados al reves
              renderItem={({ item: m }) => {
                const isMine = m.senderId === user?.id;
                // Si el mensaje es una URL de audio (simulado)
                const isAudio = m.content.startsWith('file://'); 
                return (
                  <View style={[styles.msgWrapper, isMine ? styles.msgMine : styles.msgTheirs]}>
                    <View style={[styles.msgBubble, isMine ? styles.msgBubbleMine : styles.msgBubbleTheirs]}>
                      {isAudio ? (
                        <TouchableOpacity onPress={() => playSound(m.content)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Play size={16} color={isMine ? "#fff" : "#f8fafc"} />
                          <Text style={[styles.msgText, { marginLeft: 5 }]}>Audio (Toca para reproducir)</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.msgText}>{m.content}</Text>
                      )}
                    </View>
                  </View>
                );
              }}
            />
            
            {/* Input & Audio Record Area */}
            <View style={styles.inputArea}>
              <TextInput
                style={styles.chatInput}
                value={msgInput}
                onChangeText={setMsgInput}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#64748b"
              />
              
              {msgInput.trim().length > 0 ? (
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={sending}>
                  {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={20} color="#fff" />}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.audioBtn, isRecording && styles.audioBtnRecording]} 
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <Square size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* SESSION MODAL (Descomentar e importar cuando lo unas) */}
      {/* {sessionExchange && (
        <SessionCreateModal
          exchange={sessionExchange}
          open={!!sessionExchange}
          onClose={() => setSessionExchange(null)}
          onCreated={fetchExchanges}
        />
      )} */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 60 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  tabTextActive: { color: '#f8fafc' },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userName: { color: '#f8fafc', fontWeight: 'bold', fontSize: 14 },
  messagePreview: { color: '#94a3b8', fontSize: 12, marginTop: 2, paddingRight: 10 },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15, gap: 10 },
  btnSuccess: { backgroundColor: '#84cc16', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  btnAccent: { backgroundColor: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)', borderWidth: 1, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  btnPrimary: { backgroundColor: '#2563eb', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#1e293b', fontWeight: 'bold', fontSize: 12 },

  // Chat Styles
  chatList: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10, marginBottom: 10 },
  msgWrapper: { marginBottom: 10, maxWidth: '80%' },
  msgMine: { alignSelf: 'flex-end' },
  msgTheirs: { alignSelf: 'flex-start' },
  msgBubble: { padding: 10, borderRadius: 12 },
  msgBubbleMine: { backgroundColor: '#2563eb', borderBottomRightRadius: 2 },
  msgBubbleTheirs: { backgroundColor: '#334155', borderBottomLeftRadius: 2 },
  msgText: { color: '#fff', fontSize: 14 },

  inputArea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatInput: { flex: 1, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: '#f8fafc' },
  sendBtn: { backgroundColor: '#2563eb', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  audioBtn: { backgroundColor: '#06b6d4', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  audioBtnRecording: { backgroundColor: '#ef4444' }
});