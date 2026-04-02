import { InboxOutlined } from "@ant-design/icons";
import { App, Button, Space, Upload, type UploadFile } from "antd";
import { useState } from "react";

type ImportOfficialsCSVProps = {
  onClose: () => void;
  onImport: (file: File) => void;
};

export const ImportOfficialsCSV = (props: ImportOfficialsCSVProps) => {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isPending, setIsPending] = useState(false);

  const handleUpload = async () => {
    const file = fileList[0];
    if (!file) return;

    setIsPending(true);
    try {
      props.onImport(file as unknown as File);
      message.success(`Imported officials from ${file.name}`);
      setFileList([]);
      props.onClose();
    } catch (err) {
      message.error((err as Error).message || "Failed to import officials");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
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
        <p className="ant-upload-hint">Required columns: name</p>
      </Upload.Dragger>
      <Space>
        <Button onClick={props.onClose}>Cancel</Button>
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
