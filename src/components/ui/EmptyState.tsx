import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function EmptyState({ icon, title, description, action }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.desc}>{description}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, alignItems: 'center' },
  icon: { fontSize: 40, marginBottom: 10 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  desc: { color: '#cbd5e1', textAlign: 'center', marginTop: 5 },
  action: { marginTop: 15 }
});