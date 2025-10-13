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
import Input from "@/components/Input";
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
import Container from "@/components/Container";

export default function Profile() {
  const SIZE = 150;
  const inputHeight = 60;

  const [imageLoading, setImageLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string>();

  const { width } = useWindowDimensions();

  const { updateUserProfile, user,signOut } = useAuth();

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
        mediaTypes: ["images", "livePhotos"],
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
          Alert.alert(
            "Sua imagem é muito grande",
            "Escolha uma imagem até 5 Mb"
          );
          return;
        }

        const fileExtension = photoSelected.assets[0].uri.split(".").pop();

        const photoFile = {
          name: `${user.name}.${fileExtension}`
            .replaceAll(" ", "")
            .toLowerCase(),
          uri: photoSelected.assets[0].uri,
          type: `${photoSelected.assets[0].type}/${fileExtension}`,
        } as any;

        const userPhotoUploadForm = new FormData();

        const { data }: any = await api.patch(
          "/users/avatar",
          userPhotoUploadForm,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const userUpdated = user;

        userUpdated.avatar = data.avatar;

        await updateUserProfile(userUpdated);

        Alert.alert(
          "Perfil Atualizado",
          "Sua foto de perfil foi atualizada com sucesso"
        );
      }
    } catch (error) {
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
    <>

        <ScrollView  contentContainerStyle={{ paddingBottom: 120 }}>
           <Pressable
        onPress={signOut}
        style={styles.button}
      >
        <Text>Sair</Text>
      </Pressable>
          <View style={styles.container}>
            <UserPhoto
              src={
                user.avatar
                  ? `${api.defaults.baseURL}/avatar/${user.avatar}`
                  : "https://github.com/Steel-Hard.png"
              }
              radius={80}
              size={SIZE}
              alt="profile_image"
            />
          </View>

          <Pressable onPress={handlerUserPhotoSelect} style={{ margin: 5 }}>
            <Text style={{ textAlign: "center", marginVertical: 5 }}>
              Alterar foto
            </Text>
          </Pressable>

          <View style={[styles.container, { marginTop: 10, width }]}>
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
                  style={{ height: inputHeight }}
                  value={value}
                />
              )}
            />

            <Input
              placeholder="E-mail"
              style={{ height: inputHeight }}
              editable={false}
              value={user.email}
            />
          </View>

          <View style={[styles.container, { marginTop: 10, width }]}>
            <Text
              style={{
                textAlign: "center",
                alignSelf: "flex-start",
                marginVertical: 10,
                paddingLeft: 20,
              }}
            >
              Alterar Senha
            </Text>

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
                  style={{ height: inputHeight }}
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
                  style={{ height: inputHeight }}
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
                  style={{ height: inputHeight }}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit(handleProfileUpdate)}
                />
              )}
            />

            <Pressable
              onPress={handleSubmit(handleProfileUpdate)}
              style={styles.button}
              disabled={isUpdating}
            >
                {isUpdating ? <Loading /> : <Text style={styles.buttonText}>Atualizar</Text>}
            </Pressable>
          </View>
        </ScrollView>
     
    </>
  );
}
