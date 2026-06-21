// app/(auth)/sign-in.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../src/lib/auth-context";
import { Eye, EyeOff, Zap } from "lucide-react-native";
import { useRouter } from "expo-router";

const schema = z.object({
  email: z.string().email("Ingresa un correo válido").toLowerCase(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export default function SignInScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresar</Text>
      
      <Text style={styles.label}>Correo</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} value={value} onChangeText={onChange} autoCapitalize="none" />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message as string}</Text>}

      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.passwordRow}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput 
              style={{ flex: 1, color: '#fff' }} 
              value={value} 
              onChangeText={onChange} 
              secureTextEntry={!showPass} 
            />
          )}
        />
        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
          {showPass ? <EyeOff color="#fff" size={20} /> : <Eye color="#fff" size={20} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ingresar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { color: '#cbd5e1', fontSize: 12, marginBottom: 5 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  passwordRow: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 12, borderRadius: 8, alignItems: 'center' },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  error: { color: '#ef4444', fontSize: 10, marginBottom: 10 }
});