import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/components/ui';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OnlySwapX</Text>
      <Text style={styles.subtitle}>Ruta auxiliar lista para futuros flujos modales.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
});
