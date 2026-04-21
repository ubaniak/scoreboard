import { InboxOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Space, Upload, type UploadFile } from "antd";
import { useState } from "react";

type ImportCSVProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onImport: (f: File) => Promise<unknown>;
  hint: string;
};

export const ImportCSV = ({ onClose, onImport, hint }: ImportCSVProps) => {
  const { message } = AntApp.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleUpload = () => {
    const file = fileList[0];
    if (!file) return;
    const p = onImport(file as unknown as File)
      .then(() => { message.success(`Imported from ${file.name}`); setFileList([]); })
      .catch((err: unknown) => { message.error((err as Error).message || "Import failed"); throw err; });
    onClose(p);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Upload.Dragger
        accept=".csv"
        maxCount={1}
        fileList={fileList}
        beforeUpload={(file) => { setFileList([file]); return false; }}
        onRemove={() => setFileList([])}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Click or drag a CSV file to upload</p>
        <p className="ant-upload-hint">{hint}</p>
      </Upload.Dragger>
      <Space>
        <Button onClick={() => onClose()}>Cancel</Button>
        <Button type="primary" disabled={fileList.length === 0} onClick={handleUpload}>
          Import
        </Button>
      </Space>
    </Space>
  );
};
