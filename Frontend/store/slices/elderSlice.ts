import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';

export interface Elder {
  _id: string;
  name: string;
  birthDate: string;
  deviceId: string;
  imageUrl?: string;
}

export interface ApiData {
  eldely?: Elder[];
}

interface ElderState {
  elders: Elder[];
}

const initialState: ElderState = {
  elders: [],
};

const elderSlice = createSlice({
  name: 'elder',
  initialState,
  reducers: {
    setElders(state, action: PayloadAction<Elder[]>) {
      state.elders = action.payload ?? [];
    },
    addElder(state, action: PayloadAction<Elder>) {
      state.elders.push(action.payload);
    },
    clearElders(state) {
      state.elders = [];
    },
  },
});

export const { setElders, addElder, clearElders } = elderSlice.actions;
export default elderSlice.reducer;
