import { UserDTO } from "@/@types";
import { api } from "./api";
import { setStorageToken } from "@/storage/storageToken";
import { setStorageUser } from "@/storage/storageUser";

class AuthService {
  public async storageAuthData(
    userData: UserDTO,
    token: string,
    refresh_token: string
  ) {
    try {
      await setStorageUser(userData);
      await setStorageToken({ token, refresh_token });
    } catch (error) {
      throw error;
    }
  }

  public async signin(email: string, password: string):Promise<UserDTO> {
    const { data } = await api.post("/users/signin", { email, password });

    return data;
  }
  public async signup(
    name: string,
    email: string,
    password: string,
    role: string
  ) {
    const { data } = await api.post("/users/signup", {
      name,
      email,
      password,
      role,
    });

    return data;
  }
}

export default new AuthService;
