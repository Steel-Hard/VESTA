import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  Image as RNImage,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  ElderFormData,
  elderValidationSchema,
} from "@/validation/elderValidation";
import { api } from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import { useDispatch } from "react-redux";
import { addElder, Elder } from "@/store/slices/elderSlice";

export default function TelaCadastroIdoso() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const dispatch = useDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ElderFormData>({
    defaultValues: {
      name: "",
      birthDate: "",
      macAddress: "",
    },
    resolver: yupResolver(elderValidationSchema),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleCadastro = async (elderData: ElderFormData) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("elderName", elderData.name);
      formData.append("elderBirthDate", elderData.birthDate);
      formData.append("elderDeviceId", elderData.macAddress);

      if (selectedImage) {
        const fileExtension = selectedImage.uri.split(".").pop();
        formData.append("photo", {
          name: `${elderData.name}.${fileExtension}`
            .toLowerCase()
            .replace(/\s/g, ""),
          uri: selectedImage.uri,
          type: `image/${fileExtension}`,
        } as any);
      }

      const { data } = await api.post<Elder[]>("/elder/new", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert(
        "Sucesso",
        `Idoso ${data[data.length - 1].name} cadastrado com sucesso!`
      );

      dispatch(addElder(data[data.length - 1]));

      router.back();
    } catch (error) {
      console.error("Erro:", error);
      Alert.alert("Erro", "Não foi possível cadastrar o idoso");
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
      <Pressable onPress={pickImage} style={styles.iconContainer}>
        {selectedImage ? (
          <RNImage
            source={{ uri: selectedImage.uri }}
            style={styles.selectedImageIcon}
          />
        ) : (
          <Ionicons name="images-outline" size={50} color="#9E9E9E" />
        )}
      </Pressable>

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
          <ActivityIndicator color={"white"} />
        ) : (
          <Text style={styles.buttonText}>Cadastrar Idoso</Text>
        )}
      </Pressable>
    </View>
  );
}
