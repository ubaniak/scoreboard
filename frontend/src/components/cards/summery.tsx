import { Space, Typography } from "antd";
import type { Card } from "../../entities/cards";
import { StatusTag } from "../status/tag";

const { Text } = Typography;

export type CardSummaryProps = {
  card?: Card;
};
export const CardSummary = (props: CardSummaryProps) => {
  return (
    <Space size={10} wrap>
      <Text type="secondary">
        {props.card?.name} • {props.card?.date}
      </Text>
      {props.card && <StatusTag text={props.card?.status} />}
    </Space>
  );
};
