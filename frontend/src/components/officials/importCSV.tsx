import { DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import { App, Button, Space, Upload, type UploadFile } from "antd";
import { useState } from "react";

const TEMPLATE = [
  "Name,Nationality,Year of Birth,Registration Number",
  "Jane Smith,Canada,1985,REG001",
  "John Doe,USA,1979,REG002",
].join("\n");

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "officials-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type ImportOfficialsCSVProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onImport: (file: File) => Promise<unknown>;
};

export const ImportOfficialsCSV = (props: ImportOfficialsCSVProps) => {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleUpload = () => {
    const file = fileList[0];
    if (!file) return;
    const p = props.onImport(file as unknown as File)
      .then(() => { message.success(`Imported officials from ${file.name}`); setFileList([]); })
      .catch((err: unknown) => { message.error((err as Error).message || "Failed to import officials"); throw err; });
    props.onClose(p);
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
        Download template
      </Button>
      <Upload.Dragger
        accept=".csv"
        maxCount={1}
        fileList={fileList}
        beforeUpload={(file) => { setFileList([file]); return false; }}
        onRemove={() => setFileList([])}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Click or drag a CSV file to upload</p>
        <p className="ant-upload-hint">Columns: Name, Nationality, Year of Birth, Registration Number</p>
      </Upload.Dragger>
      <Space>
        <Button onClick={() => props.onClose()}>Cancel</Button>
        <Button type="primary" disabled={fileList.length === 0} onClick={handleUpload}>
          Import
        </Button>
      </Space>
    </Space>
  );
};
