import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { getInitials, getAvatarColor } from "../../lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  style?: StyleProp<ViewStyle>;
}

const sizeMap = { sm: 28, md: 36, lg: 48, xl: 64 };

export function Avatar({ name, size = "md", style }: AvatarProps) {
  const avatarSize = sizeMap[size];
  
  return (
    <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }, style]}>
      <Text style={styles.text}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#334155' },
  text: { color: '#fff', fontWeight: 'bold' }
});