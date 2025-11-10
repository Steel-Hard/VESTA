import * as yup from "yup";

export interface ComorbidityFormData {
  elderId: string;
  name: string;
  description?: string | null;
  treatment?: string | null;
}

export const comorbidityValidationSchema: yup.ObjectSchema<ComorbidityFormData> = yup.object({
  elderId: yup.string().required("O idoso é obrigatório"),
  name: yup.string().required("O nome da comorbidade é obrigatório"),
  description: yup.string().nullable(),
  treatment: yup.string().nullable(),
});
