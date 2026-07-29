import { Button, Form, Input, InputNumber, Segmented, Select, Space, Tag, type FormProps } from "antd";
import { useState } from "react";
import type { CreateBoutProps } from "../../../api/bouts";
import type { Athlete } from "../../../api/athletes";
import type { Bout } from "../../../entities/cards";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { useTheme } from "../../../theme";
import { getMismatches, type Mismatch } from "../matchCompatibility";
import { lastUsedFormat } from "./lastUsedFormat";

export type ManualFlowProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateBoutProps) => Promise<unknown>;
  athletes?: Athlete[];
  availableAthleteIds?: number[];
  nextBoutNumber?: number;
  bouts?: Bout[];
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
      <div style={{ padding: 16, background: colors.bgElevated, minHeight: 96 }}>
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
            placeholder="Tap to choose athlete…"
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

const MISMATCH_FIELD: Record<Mismatch["dimension"], keyof CreateBoutProps> = {
  gender: "gender",
  experience: "experience",
  ageCategory: "ageCategory",
  weightClass: "weightClass",
};

const MismatchRow = ({
  mismatch,
  form,
}: {
  mismatch: Mismatch;
  form: ReturnType<typeof Form.useForm<CreateBoutProps>>[0];
}) => {
  const { colors } = useTheme();
  const fieldName = MISMATCH_FIELD[mismatch.dimension];
  const current = String(Form.useWatch(fieldName, form) ?? mismatch.redValue);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 12px",
        borderRadius: 8,
        background: colors.bg,
      }}
    >
      <span style={{ fontSize: 13, color: colors.textMuted }}>{mismatch.message}</span>
      <Segmented
        size="small"
        value={current}
        onChange={(value) => form.setFieldValue(fieldName, mismatch.dimension === "weightClass" ? Number(value) : value)}
        options={[
          { label: `Red: ${mismatch.redValue}`, value: mismatch.redValue },
          { label: `Blue: ${mismatch.blueValue}`, value: mismatch.blueValue },
        ]}
      />
    </div>
  );
};

export const ManualFlow = (props: ManualFlowProps) => {
  const [form] = Form.useForm<CreateBoutProps>();
  const [stage, setStage] = useState<1 | 2>(1);
  const screens = useBreakpoint();
  const stackCorners = !screens.md;
  const { colors } = useTheme();

  const { format: defaultFormat, source: formatSource } = lastUsedFormat(props.bouts);

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
  const mismatches = getMismatches(redAthlete, blueAthlete);
  const bothPicked = !!redAthlete && !!blueAthlete;

  const handleRedAthleteChange = (value: number) => {
    const athlete = (props.athletes ?? []).find((a) => a.id === value);
    if (!athlete) return;
    // Only overwrite fields the athlete actually has data for — falling back
    // to the form's initial defaults (e.g. gender/experience) when the
    // athlete record is missing a value, rather than clobbering a valid
    // default with an empty one (the bout record requires all four fields).
    const updates: Partial<CreateBoutProps> = { ageCategory: athlete.ageCategory };
    if (athlete.gender) updates.gender = athlete.gender;
    if (athlete.experience) updates.experience = athlete.experience;
    if (athlete.weightClass != null) updates.weightClass = athlete.weightClass;
    form.setFieldsValue(updates);
  };

  const onFinish: FormProps<CreateBoutProps>["onFinish"] = (values) => {
    props.onClose(props.onSubmit({ ...values, referee: "" }));
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
        boutType: defaultFormat.boutType,
        gloveSize: defaultFormat.gloveSize,
        roundLength: defaultFormat.roundLength,
      }}
      style={{ width: "100%" }}
      onFinish={onFinish}
    >
      {/* Kept mounted (but hidden) so these fields are always registered with
          the form — otherwise antd only includes fields with a rendered
          Form.Item in onFinish's values, and these only get a visible control
          when Stage 1 surfaces a mismatch to resolve. */}
      <Form.Item name="ageCategory" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="gender" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="experience" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="weightClass" hidden>
        <InputNumber />
      </Form.Item>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
          fontSize: 12,
          color: colors.textFaint,
        }}
      >
        <span style={{ fontWeight: stage === 1 ? 700 : 400, color: stage === 1 ? colors.text : colors.textFaint }}>
          ① Who's fighting
        </span>
        <span style={{ width: 20, height: 1, background: colors.border }} />
        <span style={{ fontWeight: stage === 2 ? 700 : 400, color: stage === 2 ? colors.text : colors.textFaint }}>
          ② Confirm format
        </span>
      </div>

      <div style={{ display: stage === 1 ? "block" : "none" }}>
        <Form.Item<CreateBoutProps>
          label="Bout #"
          name="boutNumber"
          rules={[{ required: true, message: "Bout number is required" }]}
          style={{ width: 100 }}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <div style={{ display: "flex", flexDirection: stackCorners ? "column" : "row", alignItems: stackCorners ? "stretch" : "center", gap: 4, marginBottom: 16 }}>
          <CornerCard corner="red" fieldName="redAthleteId" athleteOptions={athleteOptions} athlete={redAthlete} onChange={handleRedAthleteChange} />
          <VsBadge vertical={stackCorners} />
          <CornerCard corner="blue" fieldName="blueAthleteId" athleteOptions={athleteOptions} athlete={blueAthlete} />
        </div>

        {bothPicked && (
          <div style={{ marginBottom: 8 }}>
            {mismatches.length === 0 ? (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: colors.bg, color: colors.textMuted, fontSize: 13 }}>
                ✓ Clean match — ready to confirm format.
              </div>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }} size={6}>
                {mismatches.map((m) => (
                  <MismatchRow key={m.dimension} mismatch={m} form={form} />
                ))}
              </Space>
            )}
          </div>
        )}
      </div>

      <div style={{ display: stage === 2 ? "block" : "none" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
          <Form.Item<CreateBoutProps> label="Bout Type" name="boutType" style={{ flex: "1 1 240px", minWidth: 240 }}>
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
          <Form.Item<CreateBoutProps> label="Round Length" name="roundLength" style={{ flex: "1 1 220px", minWidth: 220 }}>
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
          <Form.Item<CreateBoutProps> label="Glove Size" name="gloveSize" style={{ flex: "1 1 220px", minWidth: 220 }}>
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
        </div>
        <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 8 }}>
          {formatSource ? `Remembered from bout #${formatSource} — change any field to override just this bout.` : "Defaults — change any field to override just this bout."}
        </div>
      </div>

      <Form.Item label={null} style={{ marginTop: 8, marginBottom: 0 }}>
        <Space>
          <Button type="text" onClick={() => props.onClose()}>
            Cancel
          </Button>
          {stage === 1 ? (
            <Button type="primary" disabled={!bothPicked} onClick={() => setStage(2)}>
              Next: Confirm Format →
            </Button>
          ) : (
            <>
              <Button onClick={() => setStage(1)}>← Back</Button>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};
