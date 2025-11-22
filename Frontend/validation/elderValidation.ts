import * as yup from 'yup';

export const elderValidationSchema = yup.object({
  name: yup.string().required('Nome é obrigatório'),
  birthDate: yup
    .string()
    .required('Data de nascimento é obrigatória'),
  macAddress: yup.string().required('Endereço MAC é obrigatório'),
});

export type ElderFormData = yup.InferType<typeof elderValidationSchema>;
