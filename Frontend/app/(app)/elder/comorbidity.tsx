import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { api } from "@/services/api";
import { useDispatch } from "react-redux";
import { addComorbidity, Comorbidity } from "@/store/slices/comorbiditySlice";

const comorbidityValidationSchema = yup.object({
  elderId: yup.string().required("Selecione o idoso"),
  name: yup.string().required("Informe o nome da comorbidade"),
  description: yup.string().optional(),
  treatment: yup.string().optional(),
});

export interface ComorbidityFormData {
  elderId: string;
  name: string;
  description?: string;
  treatment?: string;
}

export default function TelaCadastroComorbidade() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ComorbidityFormData>({
    defaultValues: {
      elderId: "",
      name: "",
      description: "",
      treatment: "",
    },
    resolver: yupResolver(comorbidityValidationSchema),
  });

  const handleCadastro = async (comorbidityData: ComorbidityFormData) => {
    try {
      setIsLoading(true);

      const { data } = await api.post<Comorbidity>(
        "/comorbidity/new",
        comorbidityData
      );

      Alert.alert("Sucesso", `Comorbidade registrada com sucesso!`);
      dispatch(addComorbidity(data));
      router.back();
    } catch (error) {
      console.error("Erro:", error);
      Alert.alert("Erro", "Não foi possível registrar a comorbidade");
    } finally {
      setIsLoading(false);
    }
  };

  const onError = () => {
    Alert.alert("Erro", "Preencha todos os campos obrigatórios");
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="medkit-outline" size={50} color="#9E9E9E" />
      </View>

      <Controller
        control={control}
        name="elderId"
        render={({ field: { onChange, value } }) => (
          <>
            <Input
              placeholder="ID do Idoso"
              value={value}
              onChangeText={onChange}
            />
            {errors.elderId && (
              <Text style={styles.errorText}>{errors.elderId.message}</Text>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <>
            <Input
              placeholder="Nome da comorbidade (ex: Diabetes, Hipertensão)"
              value={value}
              onChangeText={onChange}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Descrição (opcional)"
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />

      <Controller
        control={control}
        name="treatment"
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="Tratamento (opcional)"
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit(handleCadastro, onError)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={"white"} />
        ) : (
          <Text style={styles.buttonText}>Registrar Comorbidade</Text>
        )}
      </Pressable>
    </View>
  );
}
