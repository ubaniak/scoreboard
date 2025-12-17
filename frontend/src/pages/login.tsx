import { Button, Form, Input, Select, type FormProps } from "antd";
import { useMutateLogin } from "../api/login";
import type { Login } from "../entities/login";
import { useNavigate } from "@tanstack/react-router";
import { useProfile } from "../providers/login";

type FieldType = {
  role?: string;
  code?: string;
};

const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (errorInfo) => {
  console.log("Failed:", errorInfo);
};

export const LoginPage = () => {
  const { mutateAsync: login } = useMutateLogin();
  const navigate = useNavigate();
  const profile = useProfile();

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      const token = await login({
        role: values.role,
        code: values.code,
      } as Login);
      profile.setRole(values.role || "");
      profile.setToken(token.data);

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
    <Form
      name="Login"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item<FieldType>
        label="Role"
        name="role"
        rules={[{ required: true, message: "Please select a role" }]}
      >
        <Select
          options={[
            { value: "admin", label: "Admin" },
            { value: "judge1", label: "Judge 1" },
            { value: "judge2", label: "Judge 2" },
            { value: "judge3", label: "Judge 3" },
            { value: "judge4", label: "Judge 4" },
            { value: "judge5", label: "Judge 5" },
          ]}
        />
      </Form.Item>

      <Form.Item<FieldType>
        label="Code"
        name="code"
        rules={[{ required: true, message: "Please input your code!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item label={null}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};
