import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { styles } from "@/styles";
import { ElderCard } from "@/components/ElderCard";
import { api } from "@/services/api";
import { setElders, ApiData } from "@/store/slices/elderSlice";
import {  Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";


interface Elder {
  _id: string;
  name: string;
  birthDate: string;
  deviceId: string;
  imageUrl?: string;
}

export default function Listas() {
  const elders: Elder[] = useSelector((state: any) => {
    return state.elder?.elders ?? state.elder?.list ?? [];
  });
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const monitoringRedirect = (elder: Elder) => {
    console.log(elder);
    router.push({
      pathname: "/elder/monitoring",
      params: {
        _id: elder._id,
        name: elder.name,
        birthDate: elder.birthDate,
        deviceId: elder.deviceId,
        imageUrl: elder.imageUrl,
      },
    });
  };

  useEffect(() => {
    const fetchElders = async () => {
      try {
        const { data } = await api.get<ApiData>("/elder");
        const list = data.eldely
        dispatch(setElders(list as Elder[]));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchElders();
  }, [dispatch]);

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Nenhum idoso cadastrado</Text>
      <Text style={styles.emptySubText}>Cadastre um idoso para começar</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7E57C2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={elders}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <ElderCard
            name={item.name}
            imageUrl={item.imageUrl}
            key={index}
            onPress={() => monitoringRedirect(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        
        ListEmptyComponent={EmptyList}
      />

      <Pressable
        style={[
          styles.button,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
        onPress={() => router.push("/elder/register")}
      >
        <Text style={styles.buttonText}>Adicionar Idoso</Text>

        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}
