import * as yup from "yup";

const validadeSchemaSignIn = yup.object({
  email: yup.string().required("Informe o email").email("E-mail inválido"),
  password: yup
    .string()
    .required("Informe a senha")
    .min(6, "A senha deve ter té 6 digitos"),
});

const validateSchemaSignUp = yup.object({
  name: yup.string().required("Informe o nome"),
  email: yup.string().required("Informe o email").email("E-mail inválido"),
  password: yup
    .string()
    .required("Informe a senha")
    .min(6, "A senha deve ter té 6 digitos"),
  password_confirm: yup
    .string()
    .required("Informe a confirmação de senha")
    .oneOf([yup.ref("password")], "As senhas devem ser iguais!"),
});


export {
    validadeSchemaSignIn,
    validateSchemaSignUp
}