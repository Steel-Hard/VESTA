import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  Image as RNImage,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  ElderFormData,
  elderValidationSchema,
} from "@/validation/elderValidation";
import ElderService from "@/services/ElderService";
import * as ImagePicker from "expo-image-picker";
import { useDispatch } from "react-redux";

export default function EditElderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();
  
  // Validar e extrair parâmetros com segurança
  const elderId = Array.isArray(params._id) ? params._id[0] : params._id;
  const elderName = Array.isArray(params.name) ? params.name[0] : params.name;
  const elderBirthDate = Array.isArray(params.birthDate) ? params.birthDate[0] : params.birthDate;
  const elderDeviceId = Array.isArray(params.deviceId) ? params.deviceId[0] : params.deviceId;
  const elderImageUrl = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;

  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ElderFormData>({
    defaultValues: {
      name: elderName || "",
      birthDate: elderBirthDate || "",
      macAddress: elderDeviceId || "",
    },
    resolver: yupResolver(elderValidationSchema),
  });

  useEffect(() => {
    reset({
      name: elderName || "",
      birthDate: elderBirthDate || "",
      macAddress: elderDeviceId || "",
    });
  }, [elderName, elderBirthDate, elderDeviceId, reset]);

  // Validar se elderId existe
  useEffect(() => {
    if (!elderId) {
      Alert.alert("Erro", "ID do idoso não encontrado");
      router.back();
    }
  }, [elderId]);

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

  const handleUpdate = async (elderData: ElderFormData) => {
    if (!elderId) {
      Alert.alert("Erro", "ID do idoso é inválido");
      return;
    }

    try {
      setIsLoading(true);

      await ElderService.updateElder(elderId, {
        newElderName: elderData.name,
        newElderBirthDate: elderData.birthDate,
        newElderDeviceId: elderData.macAddress,
      });

      Alert.alert("Sucesso", "Idoso atualizado com sucesso!");
      router.back();
    } catch (error) {
      console.error("Erro:", error);
      Alert.alert("Erro", "Não foi possível atualizar o idoso");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir ${elderName}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await ElderService.deleteElder(elderId!);
              Alert.alert("Sucesso", "Idoso excluído com sucesso!");
              router.back();
            } catch (error) {
              console.error("Erro:", error);
              Alert.alert("Erro", "Não foi possível excluir o idoso");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const onError = (errors: any) => {
    console.log("Form errors:", errors);
    Alert.alert("Erro", "Por favor, preencha todos os campos corretamente");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F7FAFC" }} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}>
      <View>
        <Pressable onPress={pickImage} style={styles.iconContainer}>
          {selectedImage ? (
            <RNImage
              source={{ uri: selectedImage.uri }}
              style={styles.selectedImageIcon}
            />
          ) : elderImageUrl ? (
            <RNImage
              source={{ uri: elderImageUrl }}
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
            <>
              <Input
                placeholder="Data de nascimento"
                textContentType="birthdate"
                value={value}
                onChangeText={onChange}
              />
              {errors.birthDate && (
                <Text style={styles.errorText}>{errors.birthDate.message}</Text>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="macAddress"
          render={({ field: { onChange, value } }) => (
            <>
              <Input
                placeholder="Endereço MAC do dispositivo"
                value={value}
                onChangeText={onChange}
                autoCapitalize="characters"
              />
              {errors.macAddress && (
                <Text style={styles.errorText}>{errors.macAddress.message}</Text>
              )}
            </>
          )}
        />

        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit(handleUpdate, onError)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={"white"} />
          ) : (
            <Text style={styles.buttonText}>Atualizar Idoso</Text>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: "#E53E3E", marginTop: 10 },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleDelete}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Excluir Idoso</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

