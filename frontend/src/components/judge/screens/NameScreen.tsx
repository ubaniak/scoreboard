import { Select, Typography } from "antd";
import type { Official } from "../../../entities/cards";

type NameScreenProps = {
  role: string;
  officials: Official[];
  onSelect: (name: string) => void;
};

export const NameScreen = ({ role, officials, onSelect }: NameScreenProps) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#0b0f1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 24,
    }}
  >
    <Typography.Text
      style={{
        fontSize: 11,
        letterSpacing: 4,
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.4)",
      }}
    >
      {role}
    </Typography.Text>
    <Typography.Title level={3} style={{ margin: 0, color: "white" }}>
      Select your name
    </Typography.Title>
    <Select
      style={{ width: "100%", maxWidth: 360 }}
      size="large"
      placeholder="Select your name…"
      aria-label="Select your name"
      options={officials.map((o) => ({ value: o.name, label: o.name }))}
      onChange={onSelect}
    />
  </div>
);
