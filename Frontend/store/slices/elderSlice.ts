import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface RemoveElderPayload {
  _id: string;
}

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
    removeElder(state, action: PayloadAction<RemoveElderPayload>) {
      state.elders = state.elders.filter(elder => elder._id !== action.payload._id);
    },
    clearElders(state) {
      state.elders = [];
    },
  },
});

export const { setElders, addElder, clearElders,removeElder } = elderSlice.actions;
export default elderSlice.reducer;
