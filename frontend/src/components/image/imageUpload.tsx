import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import type { GetProp, UploadFile, UploadProps } from "antd";
import { useState } from "react";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

type ImageUploadProps = {
  currentImageUrl?: string;
  onUpload: (file: File) => void;
  onRemove?: () => void;
};

export const ImageUpload = ({ currentImageUrl, onUpload, onRemove }: ImageUploadProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>(
    currentImageUrl
      ? [{ uid: "-1", name: "image", status: "done", url: currentImageUrl }]
      : [],
  );

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleDownload = (file: UploadFile) => {
    const url = file.url || file.preview;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "image";
    a.click();
  };

  const handleRemove = (file: UploadFile) => {
    if (file.url && onRemove) {
      onRemove();
    }
    return true;
  };

  return (
    <>
      <Upload
        listType="picture-circle"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        onRemove={handleRemove}
        onDownload={handleDownload}
        showUploadList={{ showDownloadIcon: true }}
        beforeUpload={(file) => {
          onUpload(file);
          return false;
        }}
        accept="image/*"
        maxCount={1}
      >
        {fileList.length === 0 ? (
          <button style={{ border: 0, background: "none" }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
          </button>
        ) : null}
      </Upload>
      {previewImage && (
        <Image
          styles={{ root: { display: "none" } }}
          preview={{
            open: previewOpen,
            onOpenChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(""),
          }}
          src={previewImage}
        />
      )}
    </>
  );
};
