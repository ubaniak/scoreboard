import { Button, Select, Typography } from "antd";
import { useState } from "react";
import type { Official } from "../../../entities/cards";
import { formatRole, space, tracking, type, useTheme } from "../../../theme";

type NameScreenProps = {
  role: string;
  officials: Official[];
  onSelect: (name: string) => void;
};

export const NameScreen = ({ role, officials, onSelect }: NameScreenProps) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: colors.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: space.xl,
        gap: space.lg,
      }}
    >
      <Typography.Text
        style={{
          fontSize: type.caption,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: colors.textFaint,
        }}
      >
        {formatRole(role)}
      </Typography.Text>
      <Typography.Title level={3} style={{ margin: 0, color: colors.text }}>
        Select your name
      </Typography.Title>

      {officials.length === 0 ? (
        <Typography.Text style={{ color: colors.textMuted }}>
          No officials assigned to this card.
        </Typography.Text>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: space.md,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Select
            showSearch
            placeholder="Search your name…"
            value={selected}
            onChange={(val) => setSelected(val)}
            filterOption={(input, option) =>
              (option?.label as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={officials.map((o) => ({ value: o.name, label: o.name }))}
            size="large"
            style={{ width: "100%" }}
          />
          <Button
            type="primary"
            size="large"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            style={{ width: "100%" }}
          >
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
};
