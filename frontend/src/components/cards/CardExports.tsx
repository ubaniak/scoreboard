import { Button, Divider, Flex, Space, Typography } from "antd";
import { baseUrl } from "../../api/constants";

const { Text, Title } = Typography;

type Props = {
  cardId: string;
  token: string;
};

async function downloadReport(url: string, token: string, filename: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

type ReportGroupProps = {
  title: string;
  description: string;
  onCsv: () => void;
  onPdf: () => void;
  onJpeg?: () => void;
};

const ReportGroup = ({ title, description, onCsv, onPdf, onJpeg }: ReportGroupProps) => (
  <Flex justify="space-between" align="center" gap={16} wrap>
    <div>
      <Title level={5} style={{ margin: 0 }}>{title}</Title>
      <Text type="secondary" style={{ fontSize: 12 }}>{description}</Text>
    </div>
    <Space>
      <Button onClick={onCsv}>CSV</Button>
      <Button onClick={onPdf}>PDF</Button>
      {onJpeg && <Button onClick={onJpeg}>JPEG</Button>}
    </Space>
  </Flex>
);

export const CardExports = ({ cardId, token }: Props) => {
  const base = `${baseUrl}/api/cards/${cardId}/reports`;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }} split={<Divider style={{ margin: 0 }} />}>
      <ReportGroup
        title="Full Report"
        description="Every bout's status, round length, gloves, referee, per-judge round scores, decisions, and comments."
        onCsv={() => downloadReport(`${base}/full/csv`, token, `card-${cardId}-full.csv`)}
        onPdf={() => downloadReport(`${base}/full/pdf`, token, `card-${cardId}-full.pdf`)}
      />
      <ReportGroup
        title="Public Report"
        description="Just the matchups, winners, and decisions — no judge scores, safe to share publicly. JPEG looks like the scoreboard bout list."
        onCsv={() => downloadReport(`${base}/public/csv`, token, `card-${cardId}-public.csv`)}
        onPdf={() => downloadReport(`${base}/public/pdf`, token, `card-${cardId}-public.pdf`)}
        onJpeg={() => downloadReport(`${base}/public/jpeg`, token, `card-${cardId}-public.jpg`)}
      />
      <ReportGroup
        title="Judge Consistency — Short"
        description="One row per judge: agreement %, average deviation, and consistency score across the card."
        onCsv={() =>
          downloadReport(
            `${base}/consistency/short/csv`,
            token,
            `card-${cardId}-consistency-short.csv`,
          )
        }
        onPdf={() =>
          downloadReport(
            `${base}/consistency/short/pdf`,
            token,
            `card-${cardId}-consistency-short.pdf`,
          )
        }
      />
      <ReportGroup
        title="Judge Consistency — Full"
        description="Per-judge breakdown with every bout they scored, round by round."
        onCsv={() =>
          downloadReport(
            `${base}/consistency/full/csv`,
            token,
            `card-${cardId}-consistency-full.csv`,
          )
        }
        onPdf={() =>
          downloadReport(
            `${base}/consistency/full/pdf`,
            token,
            `card-${cardId}-consistency-full.pdf`,
          )
        }
      />
    </Space>
  );
};
