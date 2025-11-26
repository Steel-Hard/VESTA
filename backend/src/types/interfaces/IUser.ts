import IElder from './IElder';

interface IUser {
  name: string;
  email: string;
  password: string;
  birthDate?: Date;
  gendser?: string;
  phone?: string;
  adress?: string;
  profession?: string;
  relationToElderly?: string;
  eldely: IElder[];
  pushToken?: string;
  authProvider: 'local' | 'google';
}

export default IUser;
