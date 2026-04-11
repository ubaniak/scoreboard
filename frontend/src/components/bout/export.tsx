import { Button, Flex, Space, Typography } from "antd";
import type { Card, Bout } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import {
  downloadFullCsv,
  downloadPublicCsv,
  downloadFullPdf,
  downloadPublicPdf,
} from "../../utils/boutExport";

const { Text, Title } = Typography;

type ExportBoutProps = {
  card: Card;
  bout: Bout;
  scores: ScoresByRound;
};

type ExportOptionProps = {
  title: string;
  description: string;
  onCsv: () => void;
  onPdf: () => void;
};

const ExportOption = (props: ExportOptionProps) => (
  <Flex justify="space-between" align="center" style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
    <div>
      <Text strong>{props.title}</Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>{props.description}</Text>
    </div>
    <Space>
      <Button size="small" onClick={props.onCsv}>CSV</Button>
      <Button size="small" onClick={props.onPdf}>PDF</Button>
    </Space>
  </Flex>
);

export const ExportBout = (props: ExportBoutProps) => {
  const { card, bout, scores } = props;

  return (
    <Flex vertical gap={0}>
      <Title level={5} style={{ marginBottom: 16 }}>Choose export format</Title>
      <ExportOption
        title="Full Report"
        description="All bout info, judge names, per-round scores, fouls, eight-counts, decision and comments"
        onCsv={() => downloadFullCsv(card, bout, scores)}
        onPdf={() => downloadFullPdf(card, bout, scores)}
      />
      <ExportOption
        title="Public Result"
        description="Bout info, winner and decision only"
        onCsv={() => downloadPublicCsv(card, bout)}
        onPdf={() => downloadPublicPdf(card, bout)}
      />
    </Flex>
  );
};
