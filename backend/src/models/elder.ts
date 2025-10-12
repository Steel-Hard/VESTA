import mongoose from 'mongoose';

const elderSchema = new mongoose.Schema({
  name: { type: String, require: true },
  birthDate: { type: Date, require: true },
  deviceId: { type: String, require: true },
});

export default elderSchema;
