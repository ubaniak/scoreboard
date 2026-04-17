import { Segmented, Typography } from "antd";
import { useEffect, useState } from "react";
import type { Card as CardEntity } from "../../entities/cards";
import { Card } from "../card/card";

const { Text } = Typography;

type Props = {
  card: CardEntity;
  onSetJudges: (count: number) => void;
};

export const CardControls = ({ card, onSetJudges }: Props) => {
  const [judgeCount, setJudgeCount] = useState<number>(card?.numberOfJudges ?? 5);

  useEffect(() => {
    setJudgeCount(card?.numberOfJudges ?? 5);
  }, [card?.numberOfJudges]);

  return (
    <Card title="Controls">
      <Text style={{ marginRight: 16 }}>Number of Judges</Text>
      <Segmented
        size="large"
        shape="round"
        value={judgeCount}
        options={[
          { value: 3, label: "3" },
          { value: 5, label: "5" },
        ]}
        onChange={(value) => {
          setJudgeCount(value as number);
          onSetJudges(value as number);
        }}
      />
    </Card>
  );
};
