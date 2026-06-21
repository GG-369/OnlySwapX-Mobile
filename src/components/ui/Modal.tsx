import React from 'react';
import { Modal as RNModal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { X } from 'lucide-react-native';

export function Modal({ open, onClose, title, children }: any) {
  return (
    <RNModal visible={open} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color="#fff" /></TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  content: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});