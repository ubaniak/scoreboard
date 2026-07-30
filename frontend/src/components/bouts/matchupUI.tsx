import { Form, Segmented, Select, Space, Tag } from "antd";
import type { FormInstance } from "antd";
import type { Athlete } from "../../api/athletes";
import { useTheme } from "../../theme";
import type { Mismatch } from "./matchCompatibility";

export type AthleteOption = { value: number; label: string };

export type CornerCardProps = {
  corner: "red" | "blue";
  fieldName: string;
  athleteOptions: AthleteOption[];
  athlete?: Athlete;
  onChange?: (value: number) => void;
};

export const CornerCard = ({ corner, fieldName, athleteOptions, athlete, onChange }: CornerCardProps) => {
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
        <Form.Item
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

export const VsBadge = ({ vertical }: { vertical: boolean }) => {
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

export type MismatchFields = {
  gender?: string;
  experience?: string;
  ageCategory?: string;
  weightClass?: number;
};

export const MismatchRow = <T extends MismatchFields>({
  mismatch,
  form,
}: {
  mismatch: Mismatch;
  form: FormInstance<T>;
}) => {
  const { colors } = useTheme();
  const fieldName = mismatch.dimension;
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
        onChange={(value) =>
          form.setFieldValue(
            fieldName as never,
            (mismatch.dimension === "weightClass" ? Number(value) : value) as never,
          )
        }
        options={[
          { label: `Red: ${mismatch.redValue}`, value: mismatch.redValue },
          { label: `Blue: ${mismatch.blueValue}`, value: mismatch.blueValue },
        ]}
      />
    </div>
  );
};
