import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ElderFormData, elderValidationSchema } from "@/validation/elderValidation";
import { api } from "@/services/api";
import Loading from "@/components/Loading";
import { format } from 'date-fns';

export default function TelaCadastroIdoso() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { 
    control, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ElderFormData>({
    defaultValues: {
      name: "",
      birthDate: "",
      macAddress: "",
    },
    resolver: yupResolver(elderValidationSchema),
  });

  const handleCadastro = async (data: ElderFormData) => {
    try {
      setIsLoading(true);
      console.log("Form data:", data); // Debug

      const payload = {
        elderName: data.name,
        elderBirthDate: data.birthDate,
        elderDeviceId: data.macAddress
      };

      await api.post('/elder/new', payload);
      Alert.alert("Sucesso", `Idoso ${data.name} cadastrado com sucesso!`);
      router.back();
    } catch (error: any) {
      console.error('Erro:', error);
      Alert.alert(
        "Erro", 
        "Não foi possível cadastrar o idoso"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Form errors:", errors);
    Alert.alert("Erro", "Por favor, preencha todos os campos corretamente");
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="add" size={50} color="#9E9E9E" />
      </View>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <>
            <Input
              placeholder="Nome completo"
              value={value}
              onChangeText={onChange}
              autoCapitalize="words"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="birthDate"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Data de nascimento"
            textContentType="birthdate"
            value={value}
            onChangeText={onChange}
            
          />
        )}
      />

      <Controller
        control={control}
        name="macAddress"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Endereço MAC do dispositivo"
            value={value}
            onChangeText={onChange}
            autoCapitalize="characters"
          />
        )}
      />

      <Pressable 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleSubmit(handleCadastro, onError)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={'white'}/>
        ) : (
          <Text style={styles.buttonText}>Cadastrar Idoso</Text>
        )}
      </Pressable>
    </View>
  );
}

