import * as yup from 'yup';

export const elderValidationSchema = yup.object({
  name: yup.string().required('Nome é obrigatório'),
  birthDate: yup
    .string()
    .matches(
      /^\d{2}\/\d{2}\/\d{4}$/,
      'Data deve estar no formato DD/MM/YYYY'
    )
    .required('Data de nascimento é obrigatória'),
  macAddress: yup.string().required('Endereço MAC é obrigatório'),
});

export type ElderFormData = yup.InferType<typeof elderValidationSchema>;
