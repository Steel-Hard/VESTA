//PDM - 009: Maurício
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Interface para tipagem forte do documento do Idoso
export interface IElderly extends Document {
  fullName: string;
  birthDate: Date;
  gender: string;
  email: string;
  password?: string; // Senha é opcional no retorno das queries
  phone: string;
  address: string;
  medicalConditions: string[];
  medications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  deviceId: string;
  alerts?: {
    date: Date;
    type: string;
    description: string;
  }[];
  caregivers?: Schema.Types.ObjectId[];
  comparePassword(password: string): Promise<boolean>;
}

const ElderlySchema = new Schema<IElderly>({
  fullName: {
    type: String,
    required: [true, 'O nome completo é obrigatório.'],
    trim: true,
  },
  birthDate: {
    type: Date,
    required: [true, 'A data de nascimento é obrigatória.'],
  },
  gender: {
    type: String,
    required: [true, 'O gênero é obrigatório.'],
    enum: ['M', 'F', 'Outro'], // Exemplo de validação para valores permitidos
  },
  email: {
    type: String,
    required: [true, 'O email é obrigatório.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Por favor, insira um email válido.'],
  },
  password: {
    type: String,
    required: [true, 'A senha é obrigatória.'],
    select: false, // Não retorna a senha em queries por padrão
  },
  phone: {
    type: String,
    required: [true, 'O telefone é obrigatório.'],
  },
  address: {
    type: String,
    required: [true, 'O endereço é obrigatório.'],
  },
  medicalConditions: {
    type: [String],
    required: true,
    default: [],
  },
  medications: {
    type: [String],
    required: true,
    default: [],
  },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { type: String, required: true },
  },
  deviceId: {
    type: String,
    required: [true, 'O ID do dispositivo wearable é obrigatório.'],
    unique: true,
  },
  alerts: [{
    date: { type: Date, required: true },
    type: { type: String, required: true },
    description: { type: String, required: true },
  }],
  caregivers: [{
    type: Schema.Types.ObjectId,
    ref: 'Caregiver', // Referência ao modelo Caregiver
  }],
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
});

// Middleware (pre-hook) para criptografar a senha antes de salvar
ElderlySchema.pre<IElderly>('save', async function (next) {
  // Executa a função apenas se a senha foi modificada (ou é nova)
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar a senha fornecida com a senha criptografada no banco
ElderlySchema.methods.comparePassword = function (password: string): Promise<boolean> {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(password, this.password);
};

const Elderly = model<IElderly>('Elderly', ElderlySchema);

export default Elderly;