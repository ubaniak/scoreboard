import { DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import { App, Button, Space, Upload, type UploadFile } from "antd";
import { useState } from "react";

const TEMPLATE = [
  "red,blue,age,experience,gender,weightClass",
  "Jane Smith,Maria Garcia,u17,open,female,54",
  "John Doe,Mike Johnson,elite,novice,male,60",
  "Alice Brown,Bob White,u13,novice,male,46",
].join("\n");

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bouts-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type ImportBoutsCSVProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onImport: (file: File) => Promise<unknown>;
};

export const ImportBoutsCSV = (props: ImportBoutsCSVProps) => {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleUpload = () => {
    const file = fileList[0];
    if (!file) return;
    const p = props.onImport(file as unknown as File)
      .then(() => { message.success(`Imported bouts from ${file.name}`); setFileList([]); })
      .catch((err: unknown) => { message.error((err as Error).message || "Failed to import bouts"); throw err; });
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
        <p className="ant-upload-hint">
          Required columns: red, blue, age, experience
          <br />
          Optional: gender, weightClass
        </p>
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
