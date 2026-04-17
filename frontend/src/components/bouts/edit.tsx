import { DeleteOutlined } from "@ant-design/icons";
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
import { useEffect } from "react";
import type { UpdateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import type { Bout, Official } from "../../entities/cards";

export type EditBoutProps = {
  bout: Bout;
  officials?: Official[];
  athletes?: Athlete[];
  onClose: () => void;
  onSubmit: (values: UpdateBoutProps) => void;
  onDelete?: () => void;
};

export const EditBout = (props: EditBoutProps) => {
  const officialOptions = (props.officials ?? []).map((o) => ({
    value: o.name,
    label: o.name,
  }));
  const athleteOptions = (props.athletes ?? []).map((a) => ({
    value: a.id,
    label: a.clubName ? `${a.name} (${a.clubName})` : a.name,
  }));
  const [form] = Form.useForm<Bout>();
  const boutType = Form.useWatch("boutType", form);
  const isScored = !boutType || boutType === "scored";

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
      <Form.Item<UpdateBoutProps> label="Bout Type" name="boutType">
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
      <Form.Item<UpdateBoutProps> label="Bout #" name="boutNumber">
        <InputNumber />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Red Athlete" name="redAthleteId">
        <Select options={athleteOptions} allowClear showSearch optionFilterProp="label" placeholder="Select athlete..." />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Red" name="redCorner">
        <Input />
      </Form.Item>
      <Form.Item<UpdateBoutProps> label="Blue Athlete" name="blueAthleteId">
        <Select options={athleteOptions} allowClear showSearch optionFilterProp="label" placeholder="Select athlete..." />
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
      {isScored && (
        <Form.Item<UpdateBoutProps> label="Judges" name="numberOfJudges">
          <Segmented
            size={"large"}
            shape="round"
            options={[
              { value: 3, label: "3" },
              { value: 5, label: "5" },
            ]}
          />
        </Form.Item>
      )}
      <Form.Item<UpdateBoutProps> label="Referee" name="referee">
        <Select
          options={officialOptions}
          allowClear
          placeholder="Select referee..."
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
          {props.onDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                props.onDelete!();
                props.onClose();
              }}
            >
              Delete
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};
