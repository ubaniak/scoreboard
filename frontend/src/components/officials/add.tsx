import { Button } from "@mui/material";
import { Formik } from "formik";
import { FormikInput } from "../formik/input";
import { useMutateOfficial } from "../../api/cards";

export type AddOfficialProps = {
  carId?: string;
};

export const AddOfficial = (props: AddOfficialProps) => {
  const { mutateAsync: addOfficial } = useMutateOfficial(props.carId || "");
  return (
    <Formik
      initialValues={{ name: "" }}
      onSubmit={async (values) => {
        await addOfficial({ name: values.name });
      }}
    >
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <FormikInput name="name" label="Name" />
          <Button type="submit">Save</Button>
        </form>
      )}
    </Formik>
  );
};
