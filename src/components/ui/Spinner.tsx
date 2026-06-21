import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export function Spinner({ size = "small" }: any) {
  return <ActivityIndicator size={size === "lg" ? "large" : "small"} color="#2563eb" />;
}

export function PageLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({ center: { flex: 1, justifyContent: 'center', alignItems: 'center' }});