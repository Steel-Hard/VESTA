import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserDTO } from "@types";
import { USER_STORAGE } from ".";

async function setStorageUser(user:UserDTO) {
    await AsyncStorage.setItem(USER_STORAGE, JSON.stringify(user));
}
async function getStorageUser() {
    const storage = await AsyncStorage.getItem(USER_STORAGE);

    const user: UserDTO =  storage? JSON.parse(storage) : { id: "",
    avatar: "",
    email: "",
    name: ""};

    return user;
    
}

async function removeStorageUser(){
    await AsyncStorage.removeItem(USER_STORAGE);
}

export{
    setStorageUser,
    getStorageUser,
    removeStorageUser
}

