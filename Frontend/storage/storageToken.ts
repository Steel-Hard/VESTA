import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOKEN_STORAGE } from ".";

type StorageAuthTokenProps = {
  token: string
  refresh_token?: string
}

async function setStorageToken({token, refresh_token}: StorageAuthTokenProps) {
    await AsyncStorage.setItem(TOKEN_STORAGE, JSON.stringify({ token, refresh_token}));
}

async function getStorageToken (){
    const res = await AsyncStorage.getItem(TOKEN_STORAGE)

    const {token, refresh_token}: StorageAuthTokenProps = res ?
    JSON.parse(res) : {};

    return {token, refresh_token}    
}


async function removeStorageToken(){
    await AsyncStorage.removeItem(TOKEN_STORAGE);
}

export{
    setStorageToken,
    removeStorageToken,
    getStorageToken
}

