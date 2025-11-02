import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';

export interface ApiData {
  eldely: Elder[];
}


interface Elder {
  id: string;
  name: string;
  birthDate: string;
  deviceId: string;
}

interface ElderState {
  elders: Elder[];
  loading: boolean;
  error: string | null;
}





const elderSlice = createSlice({
  name: 'elder',
  initialState: {
    elders: [],
    loading: false,
    error: null,
  } as ElderState,
  reducers: {},
  
  },
);

export default elderSlice.reducer;
