import { Formik } from "formik";
import { useMutateLogin } from "../api/login";
import type { Login } from "../entities/login";
import { FormikSelect } from "../components/formik/select";
import { FormikInput } from "../components/formik/input";
import { Button } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useProfile } from "../providers/login";

export const LoginPage = () => {
  const navigate = useNavigate();
  const profile = useProfile();
  const { mutateAsync: loginFn } = useMutateLogin();
  return (
    <>
      <Formik
        initialValues={{
          role: "",
          code: "",
        }}
        onSubmit={async (values: Login) => {
          try {
            const token = await loginFn({
              role: values.role,
              code: values.code,
            });
            profile.setRole(values.role);
            profile.setToken(token.data);

            if (values.role === "admin") {
              navigate({ to: "/" });
            }
            if (values.role === "judge") {
              navigate({ to: "/judge" });
            }
            if (values.role === "scoreboard") {
              navigate({ to: "/scoreboard" });
            }
          } catch (e) {
            console.log(e);
          }
        }}
      >
        {({ handleSubmit }) => (
          <form
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            onSubmit={handleSubmit}
          >
            <FormikSelect
              name="role"
              label="Role"
              options={["admin", "judge", "scoreboard"]}
            />
            <FormikInput name="code" label="Code"></FormikInput>
            <Button variant="contained" color="primary" type="submit">
              Submit
            </Button>
          </form>
        )}
      </Formik>
    </>
  );
};
