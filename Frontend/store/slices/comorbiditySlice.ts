import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/services/api";

export interface Comorbidity {
  _id: string;
  elderId: string;
  name: string;
  description?: string;
  treatment?: string;
}

export interface ApiData {
  comorbidities?: Comorbidity[];
}

interface ComorbidityState {
  comorbidities: Comorbidity[];
}

const initialState: ComorbidityState = {
  comorbidities: [],
};

const comorbiditySlice = createSlice({
  name: "comorbidity",
  initialState,
  reducers: {
    setComorbidities(state, action: PayloadAction<Comorbidity[]>) {
      state.comorbidities = action.payload ?? [];
    },
    addComorbidity(state, action: PayloadAction<Comorbidity>) {
      state.comorbidities.push(action.payload);
    },
    clearComorbidities(state) {
      state.comorbidities = [];
    },
  },
});

export const { setComorbidities, addComorbidity, clearComorbidities } =
  comorbiditySlice.actions;
export default comorbiditySlice.reducer;
