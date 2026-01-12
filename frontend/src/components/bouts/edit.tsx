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
import type { UpdateBoutProps } from "../../api/bouts";
import type { Bout } from "../../entities/cards";

export type EditBoutProps = {
  bout: Bout;
  onClose: () => void;
  onSubmit: (values: UpdateBoutProps) => void;
};

export const EditBout = (props: EditBoutProps) => {
  const [form] = Form.useForm<Bout>();
  useEffect(() => {
    form.setFieldsValue({
      ...props.bout,
    });
  }, [props.bout, form]); // Dependency on props.bout triggers the update

  const onFinish: FormProps<UpdateBoutProps>["onFinish"] = async (values) => {
    props.onSubmit(values);
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
      <Form.Item<UpdateBoutProps> label="Bout #" name="boutNumber">
        <InputNumber />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Red" name="redCorner">
        <Input />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Blue" name="blueCorner">
        <Input />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Age Cat" name="ageCategory">
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
      <Form.Item<UpdateBoutProps> label="Glove Size" name="gloveSize">
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
      <Form.Item<UpdateBoutProps> label="Gender" name="gender">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Experience" name="experience">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "open", label: "Open" },
            { value: "novice", label: "Novice" },
          ]}
        />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Round length (min)" name="roundLength">
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
      {/* <Form.Item label={null}>
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
      </Form.Item> */}
    </Form>
  );
};
