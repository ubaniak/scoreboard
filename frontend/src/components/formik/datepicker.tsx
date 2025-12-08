import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useField } from "formik";

export type FormikDatePickerProps = {
  label?: string;
  name: string;
};
export const FormikDatePicker = (props: FormikDatePickerProps) => {
  const [field] = useField({ ...props });
  const handleOnChange = (date: Date | null) => {
    const event = {
      target: {
        name: props.name,
        value: date,
      },
    };
    field.onChange(event);
  };
  return (
    <DatePicker
      label={props.label}
      value={field.value}
      onChange={handleOnChange}
    />
  );
};
