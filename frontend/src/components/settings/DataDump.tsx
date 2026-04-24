import { App, Button, Divider, Space, Typography, Upload } from "antd";
import { DownloadOutlined, InboxOutlined, UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";
import { useExportData, useImportData } from "../../api/settings";
import type { TokenBase } from "../../api/entities";
import { AutoBackup } from "./AutoBackup";

export const DataDump = ({ token }: TokenBase) => {
  const { message } = App.useApp();
  const exportData = useExportData({ token });
  const importData = useImportData({ token });

  const handleExport = async () => {
    try {
      await exportData.mutateAsync();
      message.success("Data exported successfully");
    } catch {
      message.error("Export failed");
    }
  };

  const handleImport = async (file: RcFile) => {
    try {
      await importData.mutateAsync(file as unknown as File);
      message.success("Data imported successfully — please refresh the page");
    } catch (err) {
      message.error((err as Error).message || "Import failed");
    }
    return false;
  };

  return (
    <Space direction="vertical" style={{ width: "100%", maxWidth: 480 }}>
      <div>
        <Typography.Title level={5} style={{ marginBottom: 4 }}>Export</Typography.Title>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Download a ZIP archive of all cards, bouts, athletes, clubs, officials, scores, and images.
        </Typography.Text>
        <Button
          icon={<DownloadOutlined />}
          loading={exportData.isPending}
          onClick={handleExport}
        >
          Download Data
        </Button>
      </div>

      <div style={{ marginTop: 16 }}>
        <Typography.Title level={5} style={{ marginBottom: 4 }}>Import</Typography.Title>
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Upload a previously exported ZIP to fully restore the database. This will replace all existing data.
        </Typography.Text>
        <Upload.Dragger
          accept=".zip"
          showUploadList={false}
          disabled={importData.isPending}
          beforeUpload={handleImport}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            {importData.isPending ? "Importing…" : "Click or drag a .zip export file here"}
          </p>
        </Upload.Dragger>
        {importData.isPending && (
          <Button icon={<UploadOutlined />} loading style={{ marginTop: 8 }}>
            Importing…
          </Button>
        )}
      </div>

      <Divider />
      <AutoBackup token={token} />
    </Space>
  );
};
