import { Button, Steps } from "antd";

export type RoundProgressSummaryProps = {
  cardId: string;
  boutId: string;
};

export const RoundProgressSummary = () => {
  const items = [
    {
      title: "Round 1",
    },
    {
      title: "Round 2",
    },
    {
      title: "Round 3",
    },
  ];
  return <Steps onChange={() => {}} size="small" items={items} current={2} />;
};
