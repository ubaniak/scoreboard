import { Card, Tag } from "antd";
import type { Current } from "../../entities/current";

export type ShowRoundProps = {
  current?: Current;
};
export const CurrentRoundCard = (props: ShowRoundProps) => {
  return (
    <>
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
        <div style={{ fontSize: 20, opacity: 0.8 }}>
          ROUND {props.current?.round?.roundNumber}
        </div>
        <Tag
          color="gold"
          style={{
            fontSize: 16,
            padding: "4px 12px",
            marginBottom: 16,
          }}
        >
          {props.current?.round?.status}
        </Tag>
      </Card>
    </>
  );
};
