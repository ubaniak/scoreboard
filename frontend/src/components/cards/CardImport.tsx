import { InboxOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import type { RcFile } from "antd/es/upload";

const TEMPLATE = `Card Name,Date,Bout Number,Bout Type,Red Athlete,Blue Athlete,Round Length,Glove Size
Spring Open 2024,2024-04-20,1,scored,Jane Smith,Maria Garcia,2,10oz
Spring Open 2024,2024-04-20,2,scored,John Doe,Mike Johnson,3,12oz
Spring Open 2024,2024-04-20,3,sparring,Alice Brown,Bob White,1,10oz
`;

export const CardImport = ({
  onClose,
  onImport,
}: {
  onClose: (promise?: Promise<unknown>) => void;
  onImport: (file: File) => Promise<unknown>;
}) => {
  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "card-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Button onClick={downloadTemplate}>Download Template</Button>
      <Upload.Dragger
        accept=".csv"
        showUploadList={false}
        beforeUpload={(file: RcFile) => {
          onClose(onImport(file));
          return false;
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag CSV file to import</p>
        <p className="ant-upload-hint">
          Columns: Card Name, Date, Bout Number, Bout Type, Red Athlete, Blue Athlete, Round Length, Glove Size.
          Athletes must be imported on the Athletes tab first — age category, experience, and gender are taken from the Red athlete.
        </p>
      </Upload.Dragger>
    </div>
  );
};
