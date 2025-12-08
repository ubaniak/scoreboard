import {
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useField } from "formik";

export type FormikSelectProps = {
  label: string;
  name: string;
  options: string[];
};
export const FormikSelect = (props: FormikSelectProps) => {
  const [field, , helpers] = useField({ name: props.name });

  const handleChange = (event: SelectChangeEvent) => {
    helpers.setValue(event.target.value);
  };
  return (
    <>
      <InputLabel id="select-label">{props.label}</InputLabel>
      <Select
        id="select"
        value={field.value}
        onChange={handleChange}
        label={props.label}
      >
        {props.options.map((option) => {
          return <MenuItem value={option}> {option} </MenuItem>;
        })}
      </Select>
    </>
  );
};
