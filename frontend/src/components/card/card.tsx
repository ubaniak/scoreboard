import { Card as AntCard } from "antd";
import type React from "react";
import { useTheme } from "../../theme";

export type CardProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  style?: React.CSSProperties;
};

export const Card = (props: CardProps) => {
  const { colors } = useTheme();
  return (
    <AntCard
      title={props.title}
      extra={props.extra}
      style={{
        borderRadius: 16,
        boxShadow: `${colors.shadowMd}, inset 0 1px 0 ${colors.insetHighlight}`,
        marginBottom: 16,
        ...props.style,
      }}
      styles={{
        body: { padding: 16 },
      }}
    >
      {props.children}
    </AntCard>
  );
};
