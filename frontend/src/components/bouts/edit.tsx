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
import { useEffect } from "react";
import { useMutateDeleteBout, useMutateUpdateBout } from "../../api/bouts";
import type { Bout } from "../../entities/cards";
import { useProfile } from "../../providers/login";
import { DeleteOutlined } from "@ant-design/icons";

export type EditBoutProps = {
  bout: Bout;
  carId: string;
  onClose: () => void;
};

export const EditBout = (props: EditBoutProps) => {
  const profile = useProfile();

  const [form] = Form.useForm<Bout>(); // Get form instance
  // Update form values when props.bout changes
  useEffect(() => {
    form.setFieldsValue({
      ...props.bout,
    });
  }, [props.bout, form]); // Dependency on props.bout triggers the update
  const { mutateAsync: updateBout } = useMutateUpdateBout(
    props.carId || "",
    props.bout.id
  );

  const { mutateAsync: deleteBout } = useMutateDeleteBout(
    props.carId,
    profile.token
  );

  const handleDelete = async () => {
    await deleteBout(props.bout.id || "");
    props.onClose();
  };

  const onFinish: FormProps<Bout>["onFinish"] = async (values) => {
    await updateBout({
      token: profile.token,
      toUpdate: {
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
      form={form}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<Bout> label="Bout #" name="boutNumber">
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
      <Form.Item<Bout> label="Glove Size" name="gloveSize">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "10oz", label: "10oz" },
            { value: "12oz", label: "12oz" },
            { value: "16oz", label: "16oz" },
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
            { value: "open", label: "Open" },
            { value: "novice", label: "Novice" },
          ]}
        />
      </Form.Item>
      <Form.Item<Bout> label="Round length (min)" name="roundLength">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: 1, label: "1" },
            { value: 1.5, label: "1.5" },
            { value: 2, label: "2" },
            { value: 3, label: "3" },
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
      {JSON.stringify(props.bout)}
      <Form.Item label={null}>
        <Space>
          <Button
            color="danger"
            variant="outlined"
            onClick={handleDelete}
            icon={<DeleteOutlined />}
            iconPlacement={"end"}
          >
            Delete
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
