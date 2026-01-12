import { Button, Form, Input, Select, type FormProps } from "antd";
import type { Login } from "../../entities/login";

export type LoginPageFormProps = {
  login: (values: Login) => void;
};

export const LoginPageForm = (props: LoginPageFormProps) => {
  const onFinish: FormProps<Login>["onFinish"] = async (values) => {
    props.login(values);
  };

  return (
    <Form
      name="Login"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item<Login>
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

      <Form.Item<Login>
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
