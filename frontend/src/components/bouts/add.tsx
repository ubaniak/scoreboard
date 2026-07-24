import {
  Alert,
  Button,
  Divider,
  Form,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Input,
  Tag,
  type FormProps,
} from "antd";
import type { CreateBoutProps } from "../../api/bouts";
import type { Athlete } from "../../api/athletes";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { matchWarnings } from "./matchCompatibility";
import { useTheme } from "../../theme";

export type AddBoutProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateBoutProps) => Promise<unknown>;
  athletes?: Athlete[];
  availableAthleteIds?: number[];
  nextBoutNumber?: number;
};

type AthleteOption = { value: number; label: string };

type CornerCardProps = {
  corner: "red" | "blue";
  fieldName: "redAthleteId" | "blueAthleteId";
  athleteOptions: AthleteOption[];
  athlete?: Athlete;
  onChange?: (value: number) => void;
};

const CornerCard = ({ corner, fieldName, athleteOptions, athlete, onChange }: CornerCardProps) => {
  const { colors } = useTheme();
  const bg = corner === "red" ? colors.cornerRed : colors.cornerBlue;
  const meta = athlete
    ? [
        athlete.clubName && { label: "Club", value: athlete.clubName },
        athlete.weightClass != null && { label: "Weight", value: `${athlete.weightClass}kg` },
        athlete.ageCategory && { label: "Age", value: athlete.ageCategory.toUpperCase() },
        athlete.experience && { label: "Exp", value: athlete.experience },
      ].filter((m): m is { label: string; value: string } => !!m)
    : [];

  return (
    <div style={{ flex: 1, minWidth: 0, borderRadius: 12, overflow: "hidden", border: `1px solid ${colors.border}` }}>
      <div style={{ background: bg, padding: "10px 16px" }}>
        <span
          style={{
            fontSize: 12,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 700,
          }}
        >
          {corner === "red" ? "Red Corner" : "Blue Corner"}
        </span>
      </div>
      <div style={{ padding: 16, background: colors.bgElevated }}>
        <Form.Item<CreateBoutProps>
          name={fieldName}
          rules={[{ required: true, message: `${corner === "red" ? "Red" : "Blue"} athlete is required` }]}
          style={{ marginBottom: meta.length > 0 ? 12 : 0 }}
        >
          <Select
            options={athleteOptions}
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Select athlete…"
            size="large"
            onChange={onChange}
          />
        </Form.Item>
        {meta.length > 0 && (
          <Space size={[6, 6]} wrap>
            {meta.map((m) => (
              <Tag key={m.label} bordered={false} style={{ margin: 0 }}>
                {m.label}: {m.value}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
};

const VsBadge = ({ vertical }: { vertical: boolean }) => {
  const { colors } = useTheme();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(vertical ? { padding: "4px 0" } : { padding: "0 4px" }),
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.05em",
          color: colors.textMuted,
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          flexShrink: 0,
        }}
      >
        VS
      </div>
    </div>
  );
};

export const AddBout = (props: AddBoutProps) => {
  const [form] = Form.useForm<CreateBoutProps>();
  const screens = useBreakpoint();
  const twoColumn = screens.lg;
  const stackCorners = !screens.md;

  const availableSet = new Set(props.availableAthleteIds ?? []);
  const athleteOptions: AthleteOption[] = (props.athletes ?? [])
    .filter((a) => availableSet.has(a.id))
    .map((a) => ({
      value: a.id,
      label: a.clubName ? `${a.name} (${a.clubName})` : a.name,
    }));

  const redAthleteId = Form.useWatch("redAthleteId", form);
  const blueAthleteId = Form.useWatch("blueAthleteId", form);
  const redAthlete = (props.athletes ?? []).find((a) => a.id === redAthleteId);
  const blueAthlete = (props.athletes ?? []).find((a) => a.id === blueAthleteId);
  const warnings = matchWarnings(redAthlete, blueAthlete);

  const handleRedAthleteChange = (value: number) => {
    const athlete = (props.athletes ?? []).find((a) => a.id === value);
    if (athlete) {
      form.setFieldsValue({
        ageCategory: athlete.ageCategory,
        gender: athlete.gender,
        experience: athlete.experience,
        weightClass: athlete.weightClass,
      });
    }
  };

  const onFinish: FormProps<CreateBoutProps>["onFinish"] = (values) => {
    props.onClose(props.onSubmit(values));
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        boutNumber: props.nextBoutNumber ?? 1,
        ageCategory: "",
        gender: "male",
        experience: "novice",
        boutType: "scored",
        gloveSize: "10oz",
        roundLength: 1,
      }}
      style={{ width: "100%", maxWidth: twoColumn ? 900 : 600 }}
      onFinish={onFinish}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <Form.Item<CreateBoutProps>
          label="Bout #"
          name="boutNumber"
          rules={[{ required: true, message: "Bout number is required" }]}
          style={{ marginBottom: 0, width: 100 }}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item<CreateBoutProps> label="Bout Type" name="boutType" style={{ marginBottom: 0, flex: 1 }}>
          <Segmented
            size="large"
            shape="round"
            options={[
              { value: "sparring", label: "Sparring" },
              { value: "developmental", label: "Developmental" },
              { value: "scored", label: "Scored" },
            ]}
          />
        </Form.Item>
      </div>

      <div style={{ display: "flex", flexDirection: stackCorners ? "column" : "row", alignItems: stackCorners ? "stretch" : "center", gap: 4, marginBottom: 16 }}>
        <CornerCard corner="red" fieldName="redAthleteId" athleteOptions={athleteOptions} athlete={redAthlete} onChange={handleRedAthleteChange} />
        <VsBadge vertical={stackCorners} />
        <CornerCard corner="blue" fieldName="blueAthleteId" athleteOptions={athleteOptions} athlete={blueAthlete} />
      </div>

      {warnings.length > 0 && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="Possible mismatch"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          }
        />
      )}

      <Divider titlePlacement="left" plain style={{ marginTop: 0 }}>Match Details</Divider>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Form.Item<CreateBoutProps>
          label="Age Cat"
          name="ageCategory"
          rules={[{ required: true, message: "Age category is required" }]}
          style={{ flex: "1 1 160px", minWidth: 160 }}
        >
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
        <Form.Item<CreateBoutProps> label="Weight (kg)" name="weightClass" style={{ flex: "1 1 160px", minWidth: 160 }}>
          <InputNumber min={0} step={0.5} style={{ width: "100%" }} placeholder="Auto-filled from red athlete" />
        </Form.Item>
        <Form.Item<CreateBoutProps> label="Gender" name="gender" style={{ flex: "1 1 200px", minWidth: 200 }}>
          <Segmented
            size="large"
            shape="round"
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </Form.Item>
        <Form.Item<CreateBoutProps> label="Experience" name="experience" style={{ flex: "1 1 200px", minWidth: 200 }}>
          <Segmented
            size="large"
            shape="round"
            options={[
              { value: "novice", label: "Novice" },
              { value: "open", label: "Open" },
            ]}
          />
        </Form.Item>
      </div>

      <Divider titlePlacement="left" plain>Format</Divider>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Form.Item<CreateBoutProps>
          label="Round Length"
          name="roundLength"
          rules={[{ required: true, message: "Round length is required" }]}
          style={{ flex: "1 1 220px", minWidth: 220 }}
        >
          <Segmented
            size="large"
            shape="round"
            options={[
              { value: 1, label: "1" },
              { value: 1.5, label: "1.5" },
              { value: 2, label: "2" },
              { value: 3, label: "3" },
            ]}
          />
        </Form.Item>
        <Form.Item<CreateBoutProps>
          label="Glove Size"
          name="gloveSize"
          rules={[{ required: true, message: "Glove size is required" }]}
          style={{ flex: "1 1 220px", minWidth: 220 }}
        >
          <Segmented
            size="large"
            shape="round"
            options={[
              { value: "10oz", label: "10oz" },
              { value: "12oz", label: "12oz" },
              { value: "16oz", label: "16oz" },
            ]}
          />
        </Form.Item>
        <Form.Item<CreateBoutProps> label="Referee" name="referee" style={{ flex: "1 1 200px", minWidth: 200 }}>
          <Input autoComplete="off" />
        </Form.Item>
      </div>

      <Form.Item label={null} style={{ marginTop: 8 }}>
        <Space>
          <Button type="text" onClick={() => props.onClose()}>
            Cancel
          </Button>
          {warnings.length > 0 ? (
            <Popconfirm
              title="Match anyway?"
              description="This pairing has mismatches — see warning above."
              onConfirm={() => form.submit()}
              okText="Match anyway"
              cancelText="Cancel"
            >
              <Button type="primary">Submit</Button>
            </Popconfirm>
          ) : (
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};
