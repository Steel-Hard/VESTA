import * as yup from "yup";

export const validateProfileSchema = yup.object({
  name: yup
    .string()
    .required('Informe o nome'),

  old_password: yup
    .string()
    .nullable(),  
  password: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 dígitos.')
    .nullable(),

  confirm_password: yup
    .string()
    .nullable()
    .oneOf([yup.ref('password'), null], 'A confirmação de senha não confere.')
    .when('password', {
      is: (value: string | undefined) => !!value && value.length > 0, 
      then: (schema) =>
        schema
          .required('Informe a confirmação da senha.'),
      otherwise: (schema) => schema.notRequired(),
    }),
});


export type ProfileFormDataProps = {
  name: string
  password: string
  old_password: string
  confirm_password: string
}