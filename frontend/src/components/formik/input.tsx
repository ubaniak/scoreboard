import { TextField } from "@mui/material";
import { useField } from "formik";

export type FormikInputProps = {
  label: string;
  name: string;
  type?: string;
};

export const FormikInput = (props: FormikInputProps) => {
  const [field] = useField({ ...props });

  return (
    <TextField
      {...field}
      fullWidth
      margin="normal"
      variant="outlined"
      label={props.label}
    />
  );
};
