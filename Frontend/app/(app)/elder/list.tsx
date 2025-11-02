import React, { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { styles } from "@/styles";
import { ElderCard } from "@/components/ElderCard";
import { api } from "@/services/api";
import { ApiData } from "@/store/slices/elderSlice";

interface Elder {
  id: string;
  name: string;
  birthDate: string;
  deviceId: string;
}

export default function Listas() {
  const [elders, setElders] = useState<Elder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const monitoringRedirect = (elder: Elder) => {
    console.log(elder);
    router.push({ pathname: "/elder/monitoring", params: { id: elder.id, name: elder.name, birthDate: elder.birthDate, deviceId: elder.deviceId} });
  }

  useEffect(() => {
    const fetchElders = async () => {
    try {
      const {data} = await api.get<ApiData>("/elder");
      setElders(data.eldely);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
    fetchElders();
  }, []);

  

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
        keyExtractor={(item) => item.id}
        renderItem={({ item,  index }) => (
          <ElderCard
            nome={item.name}
            key={index}
            onPress={() => monitoringRedirect(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={EmptyList}
      />

      <Pressable
        style={styles.button}
        onPress={() => router.push("/elder/register")}
      >
        <Text style={styles.buttonText}>Adicionar Idoso</Text>
      </Pressable>
    </View>
  );
}


