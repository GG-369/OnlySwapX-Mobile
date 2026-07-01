import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/components/ui';
import { readableError } from '@/utils/format';

export default function SignInScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required fields', 'Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      Alert.alert('Could not sign in', readableError(error, 'Check your credentials and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.logo}>OnlySwapX</Text>
          <Text style={styles.subtitle}>Exchange skills within your campus</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="alumno@utec.edu.pe"
            placeholderTextColor="#64748b"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor="#64748b"
            value={password}
            autoCapitalize="none"
            secureTextEntry
            onChangeText={setPassword}
          />

          <TouchableOpacity activeOpacity={0.85} style={[styles.primaryButton, submitting && styles.disabled]} onPress={handleLogin} disabled={submitting}>
            {submitting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.primaryText}>Sign in</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to OnlySwapX?</Text>
            <Link href="/(auth)/sign-up" style={styles.link}>Create account</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    marginBottom: 30,
  },
  logo: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 8,
  },
  form: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 14,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 10,
    marginTop: 24,
    padding: 14,
  },
  primaryText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.65,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    color: colors.muted,
    fontSize: 13,
  },
  link: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
  },
});
