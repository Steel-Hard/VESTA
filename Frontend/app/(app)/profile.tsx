import { UserPhoto } from "@/components/UserPhoto/";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Alert,
  ScrollView,
} from "react-native";
import { useState } from "react";
import Input from "@/components/Input/index";
import { styles } from "@/styles/index";
import * as imagePicker from "expo-image-picker";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { AppError } from "@/utils/AppError";
import {
  ProfileFormDataProps,
  validateProfileSchema,
} from "@/validation/profileValidation";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Loading from "@/components/Loading";
import { useRouter } from "expo-router";

export default function Profile() {
  const SIZE = 150;

  const [imageLoading, setImageLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string>();

  useWindowDimensions();

  const { updateUserProfile, user, signOut } = useAuth();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileFormDataProps>({
    defaultValues: {
      name: user?.name || "",
      old_password: "",
      password: "",
      confirm_password: "",
    },
    resolver: yupResolver(validateProfileSchema) as any,
  });

  const handlerUserPhotoSelect = async () => {
    setImageLoading(true);

    try {
      const photoSelected = await imagePicker.launchImageLibraryAsync({
        mediaTypes: imagePicker.MediaTypeOptions.Images,
        quality: 1,
        aspect: [4, 4],
        allowsEditing: true,
      });

      if (photoSelected.canceled) return;

      if (photoSelected.assets[0].uri) {
        if (
          photoSelected.assets[0].fileSize &&
          photoSelected.assets[0].fileSize / 1024 / 1024 > 5
        ) {
          Alert.alert("Sua imagem é muito grande", "Escolha uma imagem até 5 Mb");
          return;
        }

        const fileExtension = photoSelected.assets[0].uri.split(".").pop();

        const formData = new FormData();
        formData.append('photo', {
          name: `${user.name}.${fileExtension}`.toLowerCase().replace(/\s/g, ''),
          uri: photoSelected.assets[0].uri,
          type: `image/${fileExtension}`
        } as any);

        const { data }: any = await api.patch("/auth/upload", formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
          },
        });

        const userUpdated = { ...user, avatar: data.url };
        await updateUserProfile(userUpdated);

        Alert.alert("Perfil Atualizado", "Sua foto de perfil foi atualizada com sucesso");
      }
    } catch (error) {
      console.log(error);
      const isAppError = error instanceof AppError;

      const title = isAppError
        ? error.message
        : "Não foi possivel atualizar a imagem.";

      Alert.alert("Erro", title);
    } finally {
      setImageLoading(false);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormDataProps) => {
    try {
      setIsUpdating(true);

      const userUpdated = { ...user, name: data.name };

      await api.put("/users", data);
      await updateUserProfile(userUpdated);

      Alert.alert(
        "Perfil Atualizado",
        "Seus dados de perfil foram atualizados com sucesso"
      );
    } catch (error) {
      const isAppError = error instanceof AppError;

      const title = isAppError
        ? error.message
        : "Não foi possível atualizar o perfil";

      Alert.alert("Erro", title);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.headerContainer}>
        <UserPhoto
          src={user.avatar || "https://github.com/Steel-Hard.png"}
          radius={80}
          size={SIZE}
          alt="profile_image"
        />

        <Pressable
          onPress={handlerUserPhotoSelect}
          style={styles.changePhotoButton}
        >
          <Text style={styles.changePhotoText}>Alterar foto</Text>
        </Pressable>
      </View>

      <View style={styles.formContainer}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              placeholder="Nome"
              keyboardType="default"
              autoCapitalize="none"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Input placeholder="E-mail" editable={false} value={user.email} />

        <Text style={styles.sectionTitle}>Alterar Senha</Text>

        <Controller
          control={control}
          name="old_password"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              placeholder="Senha antiga"
              secureTextEntry
              autoCapitalize="none"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              placeholder="Nova Senha"
              secureTextEntry
              autoCapitalize="none"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="confirm_password"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              placeholder="Confirme a nova senha"
              secureTextEntry
              autoCapitalize="none"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              returnKeyType="send"
              onSubmitEditing={handleSubmit(handleProfileUpdate)}
            />
          )}
        />

        <Pressable
          onPress={handleSubmit(handleProfileUpdate)}
          style={styles.updateButton}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loading />
          ) : (
            <Text style={styles.buttonText}>Atualizar Perfil</Text>
          )}
        </Pressable>
      </View>

      <Pressable 
        onPress={async () => {
          try {
            await signOut();
            // Navega para a tela de login após logout
            router.replace("/(auth)/sign-in");
          } catch (error) {
            console.error("Erro ao fazer logout:", error);
          }
        }} 
        style={styles.signOutButton}
      >
        <Text style={styles.signOutText}>Sair</Text>
      </Pressable>
    </ScrollView>
  );
}
