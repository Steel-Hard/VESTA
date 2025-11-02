import { configureStore } from '@reduxjs/toolkit';
import elderReducer from './slices/elderSlice';

export const store = configureStore({
  reducer: {
    elder: elderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
