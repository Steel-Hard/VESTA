import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    // TODO: implement sign-up
    router.push('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Registro</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.helperText}>Mínimo 6 caracteres.</Text>

        <Pressable style={styles.primaryButton} onPress={handleSignUp}>
          <Text style={styles.primaryButtonText}>Criar</Text>
        </Pressable>

        <View style={styles.row}>
          <Text>Já tem conta?</Text>
          <Link href="/sign-in" style={styles.link}>Entrar na conta</Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  helperText: {
    color: '#666',
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#7B4AE2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  link: {
    marginLeft: 8,
    color: '#7B4AE2',
    fontWeight: '700',
  },
});