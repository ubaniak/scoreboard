import { Card, Tag } from "antd";
import type { Current } from "../../entities/current";

export type CurrentBoutCardProps = {
  current?: Current;
};

export const CurrentBoutCard = (props: CurrentBoutCardProps) => {
  if (!props.current) {
    return;
  }

  return (
    <Card
      bordered={false}
      style={{
        background: "#111827",
        color: "white",
        borderRadius: 12,
        textAlign: "center",
        padding: 24,
      }}
      bodyStyle={{ padding: 32 }}
    >
      <Tag
        color="gold"
        style={{
          fontSize: 16,
          padding: "4px 12px",
          marginBottom: 16,
        }}
      >
        NOW FIGHTING
      </Tag>

      <div style={{ fontSize: 20, opacity: 0.8 }}>
        BOUT {props.current.bout?.boutNumber}
      </div>

      {/* Fighters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        {/* Red Corner */}
        <div style={{ flex: 1, textAlign: "right" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#ff4d4f",
            }}
          >
            {props.current.bout?.redCorner.toUpperCase()}
          </div>
        </div>

        <div style={{ padding: "0 40px", fontSize: 28 }}>VS</div>

        {/* Blue Corner */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#1677ff",
            }}
          >
            {props.current.bout?.blueCorner.toUpperCase()}
          </div>
        </div>
      </div>
      <div style={{ opacity: 0.7 }}>
        {props.current.bout?.weightClass} KG • {props.current.bout?.experience}
      </div>
      <div style={{ opacity: 0.7 }}>
        Glove size: {props.current.bout?.gloveSize}
      </div>
      <div style={{ opacity: 0.7 }}>
        Round Length: {props.current.bout?.roundLength} Min(s)
      </div>
    </Card>
  );
};
