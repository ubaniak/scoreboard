import { Button, Dropdown, Space } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { baseUrl } from "../../api/constants";

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

export const CardExports = ({ cardId, token }: Props) => {
  const base = `${baseUrl}/api/cards/${cardId}/reports`;

  const items = [
    {
      key: "full-csv",
      label: "Full Report (CSV)",
      onClick: () => downloadReport(`${base}/full/csv`, token, `card-${cardId}-full.csv`),
    },
    {
      key: "full-pdf",
      label: "Full Report (PDF)",
      onClick: () => downloadReport(`${base}/full/pdf`, token, `card-${cardId}-full.pdf`),
    },
    { type: "divider" as const },
    {
      key: "public-csv",
      label: "Public Report (CSV)",
      onClick: () => downloadReport(`${base}/public/csv`, token, `card-${cardId}-public.csv`),
    },
    {
      key: "public-pdf",
      label: "Public Report (PDF)",
      onClick: () => downloadReport(`${base}/public/pdf`, token, `card-${cardId}-public.pdf`),
    },
    { type: "divider" as const },
    {
      key: "consistency-short-csv",
      label: "Judge Consistency — Short (CSV)",
      onClick: () =>
        downloadReport(
          `${base}/consistency/short/csv`,
          token,
          `card-${cardId}-consistency-short.csv`,
        ),
    },
    {
      key: "consistency-short-pdf",
      label: "Judge Consistency — Short (PDF)",
      onClick: () =>
        downloadReport(
          `${base}/consistency/short/pdf`,
          token,
          `card-${cardId}-consistency-short.pdf`,
        ),
    },
    {
      key: "consistency-full-csv",
      label: "Judge Consistency — Full (CSV)",
      onClick: () =>
        downloadReport(
          `${base}/consistency/full/csv`,
          token,
          `card-${cardId}-consistency-full.csv`,
        ),
    },
    {
      key: "consistency-full-pdf",
      label: "Judge Consistency — Full (PDF)",
      onClick: () =>
        downloadReport(
          `${base}/consistency/full/pdf`,
          token,
          `card-${cardId}-consistency-full.pdf`,
        ),
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Button icon={<DownloadOutlined />}>
        <Space>Export</Space>
      </Button>
    </Dropdown>
  );
};
