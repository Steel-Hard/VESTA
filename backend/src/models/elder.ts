import mongoose from 'mongoose';

const elderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birthDate: { type: Date, required: true },
  deviceId: { type: String, required: true },
});

export default elderSchema;
