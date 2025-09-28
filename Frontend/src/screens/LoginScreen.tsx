import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    // Simular login (substituir por lógica real)
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
    }, 1500);
  };

  const handleForgotPassword = () => {
    Alert.alert('Recuperar Senha', 'Funcionalidade em desenvolvimento');
  };

  const handleRegister = () => {
    Alert.alert('Cadastro', 'Funcionalidade em desenvolvimento');
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="bg-vesta-primary pt-16 pb-8 px-6">
        <View className="items-center">
          <Text className="text-white text-3xl font-bold mb-2">
            VESTA
          </Text>
          <Text className="text-blue-100 text-center">
            Sistema de Monitoramento de Idosos
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-8">
        <View className="bg-white rounded-2xl p-6 shadow-lg">
          <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Bem-vindo de volta
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Faça login para acessar o sistema
          </Text>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Email
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
              placeholder="seu@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">
              Senha
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
              placeholder="Sua senha"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className={`bg-vesta-primary rounded-lg py-4 mb-4 ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword} className="mb-6">
            <Text className="text-vesta-primary text-center font-medium">
              Esqueceu sua senha?
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200"></View>
            <Text className="mx-4 text-gray-500">ou</Text>
            <View className="flex-1 h-px bg-gray-200"></View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            className="border border-vesta-primary rounded-lg py-4"
            onPress={handleRegister}
          >
            <Text className="text-vesta-primary text-center font-semibold text-lg">
              Criar conta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-gray-500 text-sm text-center">
            Ao continuar, você concorda com nossos{'\n'}
            <Text className="text-vesta-primary">Termos de Uso</Text> e{' '}
            <Text className="text-vesta-primary">Política de Privacidade</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
