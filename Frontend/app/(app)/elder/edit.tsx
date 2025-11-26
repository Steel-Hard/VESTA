import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  ToastAndroid,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { styles } from "@/styles";
import Input from "@/components/Input";
import DateInput from "@/components/DateInput";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  ElderFormData,
  elderValidationSchema,
} from "@/validation/elderValidation";
import ElderService from "@/services/ElderService";
import { useDispatch } from "react-redux";
import { removeElder, updateElder } from "@/store/slices/elderSlice";

export default function EditElderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch();

  const elderId = Array.isArray(params._id) ? params._id[0] : params._id;
  const elderName = Array.isArray(params.name) ? params.name[0] : params.name;
  const elderBirthDate = Array.isArray(params.birthDate)
    ? params.birthDate[0]
    : params.birthDate;
  const elderDeviceId = Array.isArray(params.deviceId)
    ? params.deviceId[0]
    : params.deviceId;

  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, reset } = useForm<ElderFormData>({
    defaultValues: {
      name: elderName || "",
      birthDate: elderBirthDate || "",
      macAddress: elderDeviceId || "",
    },
    resolver: yupResolver(elderValidationSchema),
  });

  useEffect(() => {
    if (!elderId) {
      Alert.alert("Erro", "ID do idoso não encontrado");
      router.back();
      return;
    }

    reset({
      name: elderName || "",
      birthDate: elderBirthDate || "",
      macAddress: elderDeviceId || "",
    });
  }, [elderId, elderName, elderBirthDate, elderDeviceId, reset]);

  const handleUpdate = async (elderData: ElderFormData) => {
    if (!elderId) return;

    try {
      setIsLoading(true);

      await ElderService.updateElder(elderId, {
        newElderName: elderData.name,
        newElderBirthDate: elderData.birthDate,
        newElderDeviceId: elderData.macAddress,
      });

      dispatch(
        updateElder({
          _id: elderId,
          name: elderData.name,
          birthDate: elderData.birthDate,
          deviceId: elderData.macAddress,
        })
      );

      Alert.alert("Sucesso", "Idoso atualizado com sucesso!");
      router.push("/elder/list");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
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
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              if (elderId) {
                await ElderService.deleteElder(elderId);
                dispatch(removeElder({ _id: elderId }));
                Alert.alert("Sucesso", "Idoso excluído com sucesso!");
                router.navigate("/elder/list");
              }
            } catch (error) {
              console.error("Erro ao excluir:", error);
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
    if (Platform.OS === "android") {
      Object.values(errors).forEach((field: any) => {
        ToastAndroid.show(field.message, ToastAndroid.SHORT);
      });
    } else {
      Alert.alert("Erro", "Verifique os campos e tente novamente");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F7FAFC" }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
    >
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 20,
            color: "#333",
          }}
        >
          Editar Dados de {elderName}
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 30 }}>
          Preencha os campos abaixo para atualizar as informações.
        </Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Nome completo"
              value={value}
              onChangeText={onChange}
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, value } }) => (
            <DateInput
              placeholder="Data de nascimento"
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
          onPress={handleSubmit(handleUpdate, onError)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={"white"} />
          ) : (
            <Text style={styles.buttonText}>Salvar Idoso</Text>
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
