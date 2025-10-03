import mongoose from 'mongoose';

const elderSchema = new mongoose.Schema({
  name: { type: String, require: true },
  birthDate: { type: Date, require: true },
  deviceId: { type: String, unique: true, require: true, sparse: true},
});

export default elderSchema;
