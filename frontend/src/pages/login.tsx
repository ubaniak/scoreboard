import { useNavigate } from "@tanstack/react-router";
import { useMutateLogin } from "../api/login";
import { LoginPageForm } from "../components/login/login";
import type { Login } from "../entities/login";
import { useProfile } from "../providers/login";
import { PageLayout } from "../layouts/page";
import { Card } from "../components/card/card";
import { Row } from "antd";

export const LoginPage = () => {
  const { mutateAsync: login } = useMutateLogin();
  const navigate = useNavigate();
  const profile = useProfile();

  const onFinish = async (values: Login) => {
    try {
      const token = await login({
        role: values.role,
        code: values.code,
      } as Login);
      profile.setRole(values.role || "");
      profile.setToken(token);

      if (values.role === "admin") {
        navigate({ to: "/" });
      }
      if (values.role?.startsWith("judge")) {
        navigate({ to: "/judge" });
      }
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <PageLayout title="Login">
      <Card>
        <Row justify="center" align="middle" style={{ width: "100%" }}>
          <LoginPageForm login={onFinish} />
        </Row>
      </Card>
    </PageLayout>
  );
};
