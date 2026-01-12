import { Card as AntCard } from "antd";
import type React from "react";

export type CardProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  extra?: React.ReactNode;
};

export const Card = (props: CardProps) => {
  return (
    <AntCard
      title={props.title}
      extra={props.extra}
      style={{
        borderRadius: 16,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        marginBottom: 16,
      }}
      styles={{
        body: { padding: 16 },
      }}
    >
      {props.children}
    </AntCard>
  );
};
