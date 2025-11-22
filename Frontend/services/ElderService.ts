import { api } from "./api";

interface UpdateElderData {
  newElderName: string;
  newElderBirthDate: string;
  newElderDeviceId: string;
}

class ElderService {
  public async updateElder(elderId: string, data: UpdateElderData) {
    const { data: response } = await api.put(`/elder/${elderId}`, data);
    return response;
  }

  public async deleteElder(elderId: string) {
    const { data: response } = await api.delete(`/elder/${elderId}`);
    return response;
  }
}

export default new ElderService();
