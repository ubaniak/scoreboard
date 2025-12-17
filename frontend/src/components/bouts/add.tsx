import {
  Button,
  Form,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  type FormProps,
} from "antd";
import { useProfile } from "../../providers/login";
import type { Bout } from "../../entities/cards";
import { useMutateBout } from "../../api/bouts";

export type AddBoutProps = {
  carId: string;
  onClose: () => void;
};

export const AddBout = (props: AddBoutProps) => {
  const profile = useProfile();
  const { mutateAsync: createBout } = useMutateBout(props.carId || "");
  const onFinish: FormProps<Bout>["onFinish"] = async (values) => {
    console.log(values);
    await createBout({
      token: profile.token,
      toCreate: {
        ...values,
      },
    });
    props.onClose();
  };
  return (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{
        boutNumber: 0,
        redCorner: "",
        blueCorner: "",
        ageCategory: "",
        gender: "male",
        experience: "novice",
      }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<Bout> label="Bout Number" name="boutNumber">
        <InputNumber />
      </Form.Item>
      <Form.Item<Bout> label="Red" name="redCorner">
        <Input />
      </Form.Item>
      <Form.Item<Bout> label="Blue" name="blueCorner">
        <Input />
      </Form.Item>
      <Form.Item<Bout> label="Age Cat" name="ageCategory">
        <Select
          options={[
            { value: "juniorA", label: "Junior A" },
            { value: "juniorB", label: "Junior B" },
            { value: "juniorC", label: "Junior C" },
            { value: "youth", label: "youth" },
            { value: "elite", label: "Elite" },
            { value: "masters", label: "Masters" },
          ]}
        />
      </Form.Item>
      <Form.Item<Bout> label="Gender" name="gender">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<Bout> label="Experience" name="experience">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "novice", label: "Novice" },
            { value: "open", label: "Open" },
          ]}
        />
      </Form.Item>
      <Form.Item label={null}>
        <Space>
          <Button type="text" onClick={props.onClose}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
