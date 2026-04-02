import { Flex, Tag, Typography } from "antd";
import type { Score } from "../../entities/scores";
import { DisplayScore } from "./display_score";

const { Text } = Typography;

const statusColor: Record<string, string> = {
  not_started: "default",
  requested: "processing",
  complete: "success",
};

export type ScoreProps = {
  score: Score;
};

export const ScoreDisplay = ({ score }: ScoreProps) => {
  return (
    <Flex align="center">
      <Text style={{ minWidth: 60 }}>{score.judgeRole}</Text>
      <Text type="secondary" style={{ flex: 1 }}>
        {score.judgeName}
      </Text>
      <DisplayScore red={score.red} blue={score.blue} />
      <Tag
        color={statusColor[score.status ?? "not_started"]}
        style={{ minWidth: 90, textAlign: "center" }}
      >
        {score.status?.replace("_", " ") ?? "Not started"}
      </Tag>
    </Flex>
  );
};
