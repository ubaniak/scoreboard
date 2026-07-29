import { CloudSyncOutlined } from "@ant-design/icons";
import { Button, Tooltip, Typography } from "antd";
import { useTheme } from "../../../theme";
import { ImportBoutsCSV } from "../importCSV";

export type ImportPanelProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onImport: (file: File) => Promise<unknown>;
};

export const ImportPanel = (props: ImportPanelProps) => {
  const { colors } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ImportBoutsCSV onClose={props.onClose} onImport={props.onImport} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 12,
          background: colors.bgElevated,
          border: `1px solid ${colors.borderSubtle}`,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Sync from Google Drive</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Redesigned Drive sync is in progress — for now, use Settings → Google Drive.
          </Typography.Text>
        </div>
        <Tooltip title="Coming soon">
          <Button disabled icon={<CloudSyncOutlined />}>
            Sync Now
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};
