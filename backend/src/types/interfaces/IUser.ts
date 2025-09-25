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
}

export default IUser;
