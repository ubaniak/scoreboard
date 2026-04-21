import { InboxOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import type { RcFile } from "antd/es/upload";

const TEMPLATE = `Name: Spring Open 2024
Date: 2024-04-20

Officials:
Name,Nationality,Year of Birth,Registration Number
Jane Smith,CAN,1985,REG001
John Doe,USA,1979,REG002

Bouts:
Bout Number,Bout Type,Red Athlete,Red Club,Blue Athlete,Blue Club,Age Category,Experience,Gender,Round Length,Glove Size
1,scored,Alice Johnson,Eastside Boxing,Bob Williams,Westside BC,u17,open,female,2,8oz
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
          Imports card, officials, clubs, athletes, and bouts from a single CSV file
        </p>
      </Upload.Dragger>
    </div>
  );
};
