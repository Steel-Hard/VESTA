import mongoose, { SchemaDefinitionProperty } from 'mongoose';
import elderSchema from './elder';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  avatar: String,
  name: { type: String, require: true },
  email: {
    type: String,
    require: true,
    unique: true,
    validate: {
      validator: function (e: string) {
        return /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(e);
      },
      message: (e: SchemaDefinitionProperty) =>
        `${e.toString()} não é um email valido.`,
    },
  },
  password: { type: String, min: 6, max: 12 },
  phoneNumber: { type: String, require: false },
  eldely: [elderSchema],
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userModel = mongoose.model('User', userSchema);

export default userModel;
