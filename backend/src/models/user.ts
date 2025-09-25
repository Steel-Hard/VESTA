import mongoose, { SchemaDefinitionProperty } from 'mongoose';

const userSchema = new mongoose.Schema({
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
  password: { type: String, require: true, min: 6, max: 12 },
});

const userModel = mongoose.model('User', userSchema);

export default userModel;
