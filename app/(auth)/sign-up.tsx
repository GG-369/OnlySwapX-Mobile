import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../src/lib/auth-context";
import { UserPlus } from "lucide-react-native";
import { useRouter } from "expo-router";

const schema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Correo inválido").toLowerCase(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await signUp(data);
      Alert.alert("¡Éxito!", "Cuenta creada");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      {/* Añade aquí tus inputs de Nombre, Email, Password siguiendo el estilo de sign-in */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
         <Text style={styles.btnText}>Registrarse</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  button: { backgroundColor: '#84cc16', padding: 15, borderRadius: 8, marginTop: 20 },
  btnText: { color: '#000', textAlign: 'center', fontWeight: 'bold' }
});