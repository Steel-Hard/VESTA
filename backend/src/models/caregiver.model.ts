import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Interface para tipagem forte do documento do Cuidador
export interface ICaregiver extends Document {
  fullName: string;
  birthDate: Date;
  gender: string;
  email: string;
  password?: string; // Senha é opcional no retorno das queries
  phone: string;
  address: string;
  profession: string;
  relationToElderly: string;
  elderly?: Schema.Types.ObjectId[];
  comparePassword(password: string): Promise<boolean>;
}

const CaregiverSchema = new Schema<ICaregiver>({
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
    enum: ['M', 'F', 'Outro'],
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
    required: [true, 'O telefone de contato é obrigatório.'],
  },
  address: {
    type: String,
    required: [true, 'O endereço é obrigatório.'],
  },
  profession: {
    type: String,
    required: [true, 'A profissão é obrigatória.'],
  },
  relationToElderly: {
    type: String,
    required: [true, 'O tipo de vínculo com o idoso é obrigatório.'],
  },
  elderly: [{
    type: Schema.Types.ObjectId,
    ref: 'Elderly', // Referência ao modelo Elderly
  }],
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
});

// Middleware (pre-hook) para criptografar a senha antes de salvar
CaregiverSchema.pre<ICaregiver>('save', async function (next) {
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
CaregiverSchema.methods.comparePassword = function (password: string): Promise<boolean> {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(password, this.password);
};


const Caregiver = model<ICaregiver>('Caregiver', CaregiverSchema);

export default Caregiver;