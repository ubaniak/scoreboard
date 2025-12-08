import { Box, Button } from "@mui/material";
import { Formik } from "formik";
import { FormikDatePicker } from "../formik/datepicker";
import { FormikInput } from "../formik/input";
import { useMutateCards } from "../../api/cards";

export type CreateCardValues = {
  name: string;
  date: Date;
};

export type CreateCardProps = {
  onSubmit: (values: CreateCardValues) => void;
  onCancel: () => void;
};

export const CreateCardForm = (props: CreateCardProps) => {
  const { mutateAsync: createCard } = useMutateCards();
  return (
    <Formik
      initialValues={{
        name: "",
        date: new Date(),
      }}
      onSubmit={async (values: CreateCardValues) => {
        try {
          await createCard({ name: values.name, date: values.date.toString() });
        } catch (e) {
          console.log(e);
        }
        props.onSubmit(values);
      }}
    >
      {({ handleSubmit }) => (
        <form
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          onSubmit={handleSubmit}
        >
          <FormikInput label={"Name"} name={"name"} />
          <FormikDatePicker name={"date"} />
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              color="error"
              type="button"
              onClick={props.onCancel}
            >
              Cancel
            </Button>
            <Button variant="contained" color="primary" type="submit">
              Submit
            </Button>
          </Box>
        </form>
      )}
    </Formik>
  );
};
