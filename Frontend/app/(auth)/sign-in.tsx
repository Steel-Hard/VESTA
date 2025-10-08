import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';

// Try to import Gluestack components; use fallbacks to RN primitives when missing.
import * as GluestackButton from '@gluestack-ui/button';
import * as GluestackInput from '@gluestack-ui/input';
const GButton = (GluestackButton as any).Button || (GluestackButton as any).default || Pressable;
const GButtonText = (GluestackButton as any).ButtonText || (GluestackButton as any).default || ((props: any) => <Text {...props} />);

const GInput = (GluestackInput as any).Input || (GluestackInput as any).default || TextInput;

const VStack = View;

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    // TODO: wire real sign-in
    router.push('/');
  };

  const handleGoogleSignIn = async () => {
    // TODO: integrate Expo Google auth. Placeholder now.
    console.log('Google sign in pressed');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <VStack style={styles.card}>
        <Text style={styles.title}>Entre com sua conta</Text>

        {/* Use Gluestack Input if available */}
  <GInput style={styles.input as any} placeholder="E-mail" value={email} onChangeText={setEmail} />

  <GInput style={styles.input as any} placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />

        <GButton style={styles.primaryButton as any} onPress={handleSignIn}>
          <GButtonText style={styles.primaryButtonText as any}>Entrar</GButtonText>
        </GButton>

        <GButton style={styles.googleButton as any} onPress={handleGoogleSignIn}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Entrar com Google</Text>
        </GButton>

        <View style={styles.row}>
          <Text>Não tem conta?</Text>
          <Link href="/sign-up" style={styles.link}>Criar conta</Link>
        </View>
      </VStack>
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 16,
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