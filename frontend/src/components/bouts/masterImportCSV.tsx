import { DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import { App, Button, Space, Upload, type UploadFile } from "antd";
import { useState } from "react";

type Props = {
  onClose: () => void;
  onImport: (file: File) => Promise<unknown>;
};

const TEMPLATE_ROWS = [
  "Bout Number,Bout Type,Red,Red Club,Blue,Blue Club,Age Category,Gender,Experience,Round Length,Glove Size",
  "1,Scored,Jane Smith,City Boxing,Maria Garcia,Westside Club,Elite,Female,Open,2 min,10 oz",
  "2,Scored,John Doe,City Boxing,Mike Johnson,Westside Club,U17,Male,Novice,1.5 min,12 oz",
  "3,Sparring,Alice Brown,,Bob White,,U13,Male,Novice,1 min,10 oz",
];

function downloadTemplate() {
  const content = TEMPLATE_ROWS.join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bout-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const MasterImportCSV = ({ onClose, onImport }: Props) => {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isPending, setIsPending] = useState(false);

  const handleUpload = async () => {
    const file = fileList[0];
    if (!file) return;
    setIsPending(true);
    try {
      await onImport(file as unknown as File);
      message.success(`Imported bouts from ${file.name}`);
      setFileList([]);
      onClose();
    } catch (err) {
      message.error((err as Error).message || "Failed to import bouts");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Button icon={<DownloadOutlined />} onClick={downloadTemplate} size="small">
        Download template CSV
      </Button>
      <Upload.Dragger
        accept=".csv"
        maxCount={1}
        fileList={fileList}
        beforeUpload={(file) => {
          setFileList([file]);
          return false;
        }}
        onRemove={() => setFileList([])}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag a CSV file to upload</p>
        <p className="ant-upload-hint">
          Columns: Bout Number, Bout Type, Red, Red Club, Blue, Blue Club,
          <br />
          Age Category, Gender, Experience, Round Length, Glove Size
          <br />
          Age Category: U13, U15, U17, U19, Elite, Masters
        </p>
      </Upload.Dragger>
      <Space>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="primary"
          disabled={fileList.length === 0}
          loading={isPending}
          onClick={handleUpload}
        >
          Import
        </Button>
      </Space>
    </Space>
  );
};
