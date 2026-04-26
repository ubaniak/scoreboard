import type { Current } from "../../entities/current";

export type ShowRoundProps = {
  current?: Current;
};

export const CurrentRoundCard = (props: ShowRoundProps) => {
  return (
    <div
      style={{
        background: "#111827",
        color: "white",
        borderRadius: 12,
        textAlign: "center",
        padding: 32,
      }}
    >
      <div style={{ fontSize: 20, opacity: 0.8 }}>
        ROUND {props.current?.round?.roundNumber}
      </div>
      <span
        style={{
          display: "inline-block",
          background: "#d4a017",
          color: "#000",
          fontSize: 16,
          padding: "4px 12px",
          borderRadius: 4,
          marginBottom: 16,
        }}
      >
        {props.current?.round?.status}
      </span>
    </div>
  );
};
