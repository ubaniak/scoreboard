import {
  Button,
  Form,
  InputNumber,
  Segmented,
  Select,
  Space,
  Input,
  type FormProps,
} from "antd";
import type { CreateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";

export type AddBoutProps = {
  onClose: () => void;
  onSubmit: (values: CreateBoutProps) => void;
  athletes?: Athlete[];
};

export const AddBout = (props: AddBoutProps) => {
  const athleteOptions = (props.athletes ?? []).map((a) => ({
    value: a.id,
    label: a.clubName ? `${a.name} (${a.clubName})` : a.name,
  }));

  const onFinish: FormProps<CreateBoutProps>["onFinish"] = async (values) => {
    props.onSubmit(values);
    props.onClose();
  };

  return (
    <Form
      labelCol={{ span: 4 }}
      wrapperCol={{ span: 14 }}
      layout="horizontal"
      initialValues={{
        boutNumber: 0,
        ageCategory: "",
        gender: "male",
        experience: "novice",
        boutType: "scored",
        gloveSize: "10oz",
        roundLength: "1 min",
      }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
    >
      <Form.Item<CreateBoutProps> label="Bout Type" name="boutType">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "sparring", label: "Sparring" },
            { value: "developmental", label: "Developmental" },
            { value: "scored", label: "Scored" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Bout Number" name="boutNumber">
        <InputNumber />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Red Athlete" name="redAthleteId">
        <Select
          options={athleteOptions}
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Select athlete..."
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Blue Athlete" name="blueAthleteId">
        <Select
          options={athleteOptions}
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Select athlete..."
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Age Cat" name="ageCategory">
        <Select
          options={[
            { value: "u13", label: "U13" },
            { value: "u15", label: "U15" },
            { value: "u17", label: "U17" },
            { value: "u19", label: "U19" },
            { value: "elite", label: "Elite" },
            { value: "masters", label: "Masters" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Gender" name="gender">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps> label="Experience" name="experience">
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: "novice", label: "Novice" },
            { value: "open", label: "Open" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps>
        label="Round Length"
        name="roundLength"
        rules={[{ required: true, message: "Round length is required" }]}
      >
        <Segmented
          size={"large"}
          shape="round"
          options={[
            { value: 1, label: "1 min" },
            { value: 1.5, label: "1.5 min" },
            { value: 2, label: "2 min" },
            { value: 3, label: "3 min" },
          ]}
        />
      </Form.Item>
      <Form.Item<CreateBoutProps>
        label="Glove Size"
        name="gloveSize"
        rules={[{ required: true, message: "Glove size is required" }]}
      >
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
      <Form.Item<CreateBoutProps> label="Referee" name="referee">
        <Input />
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
