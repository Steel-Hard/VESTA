import { api } from "./api";

class ApiService {
    private basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    protected async get<T>(endpoint: string): Promise<T> {
        const { data } = await api.get<T>(`${this.basePath}${endpoint}`);
        return data;
    }

    protected async post<T, U>(endpoint: string, body: U): Promise<T> {
        const { data } = await api.post<T>(`${this.basePath}${endpoint}`, body);
        return data;
    }

    protected async put<T, U>(endpoint: string, body: U): Promise<T> {
        const { data } = await api.put<T>(`${this.basePath}${endpoint}`, body);
        return data;
    }

    protected async delete<T>(endpoint: string): Promise<T> {
        const { data } = await api.delete<T>(`${this.basePath}${endpoint}`);
        return data;
    }
}

export default ApiService;