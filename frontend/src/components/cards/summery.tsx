import { Space, Typography } from "antd";
import type { Card } from "../../entities/cards";
import { StatusTag } from "../status/tag";

const { Text } = Typography;

export type CardSummaryProps = {
  card?: Card;
  // Overrides the card's status in the tag, e.g. the bout page shows the
  // current bout's status so the header matches the bout below it.
  status?: string;
};
export const CardSummary = (props: CardSummaryProps) => {
  return (
    <Space size={10} wrap>
      <Text type="secondary">
        {props.card?.name} • {props.card?.date}
      </Text>
      {props.card && <StatusTag text={props.status ?? props.card.status} />}
    </Space>
  );
};
