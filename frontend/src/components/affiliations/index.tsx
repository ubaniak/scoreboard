import { DeleteOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { Avatar, Button, Input, Popconfirm, Segmented, Space, Table, Tag, type TableProps } from "antd";
import { useMemo, useState } from "react";
import type {
  Affiliation,
  AffiliationType,
  CreateAffiliationProps,
  UpdateAffiliationProps,
} from "../../api/affiliations";
import { ActionMenu } from "../actionMenu/actionMenu";
import { ImageUpload } from "../image/imageUpload";
import { ImportCSV } from "../shared/ImportCSV";
import { TableLayout } from "../../layouts/table";
import { AddAffiliation } from "./AddAffiliation";
import { EditAffiliation } from "./EditAffiliation";

type FilterValue = "all" | AffiliationType;

type Props = {
  affiliations?: Affiliation[];
  loading?: boolean;
  onCreate: (v: CreateAffiliationProps) => Promise<unknown>;
  onUpdate: (args: { id: number; toUpdate: UpdateAffiliationProps }) => Promise<unknown>;
  onDelete: (id: number) => void;
  onUploadImage: (args: { id: number; file: File }) => Promise<unknown> | void;
  onRemoveImage: (id: number) => void;
  onImport: (file: File) => Promise<unknown>;
};

const TYPE_LABEL: Record<AffiliationType, string> = {
  club: "Club",
  province: "Province",
  nation: "Nation",
  other: "Other",
};

export const AffiliationIndex = ({
  affiliations,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onUploadImage,
  onRemoveImage,
  onImport,
}: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(() => {
    return (affiliations ?? []).filter((a) => {
      if (filter !== "all" && a.type !== filter) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return a.name.toLowerCase().includes(q);
    });
  }, [affiliations, filter, search]);

  const columns: TableProps<Affiliation>["columns"] = [
    {
      title: "Name",
      key: "name",
      render: (_, r) => (
        <Space>
          <Avatar src={r.imageUrl} size="small">{r.name[0]}</Avatar>
          {r.name}
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t: AffiliationType) => <Tag>{TYPE_LABEL[t] ?? t}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          <ActionMenu
            trigger={{ shape: "circle", icon: <PictureOutlined />, ariaLabel: "Upload image" }}
            content={{
              title: "Upload Image",
              body: () => (
                <ImageUpload
                  currentImageUrl={r.imageUrl}
                  onUpload={(file) => onUploadImage({ id: r.id, file })}
                  onRemove={() => onRemoveImage(r.id)}
                />
              ),
            }}
          />
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined />, ariaLabel: "Edit affiliation" }}
            content={{
              title: "Edit Affiliation",
              body: (close) => (
                <EditAffiliation
                  affiliation={r}
                  onClose={close}
                  onSubmit={(vals) => onUpdate({ id: r.id, toUpdate: vals })}
                />
              ),
            }}
          />
          <Popconfirm title="Delete this affiliation?" onConfirm={() => onDelete(r.id)} okText="Delete" cancelText="Cancel">
            <Button danger shape="circle" icon={<DeleteOutlined />} aria-label="Delete affiliation" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <TableLayout
      actions={
        <>
          <ActionMenu
            trigger={{ text: "Import" }}
            content={{
              title: "Import Affiliations",
              body: (close) => (
                <ImportCSV
                  onClose={close}
                  onImport={onImport}
                  hint="Required columns: name, type (club | province | nation)"
                  template={{
                    filename: "affiliations-template.csv",
                    content: "name,type\nCity Boxing Club,club\nOntario,province\nCanada,nation",
                  }}
                />
              ),
            }}
          />
          <ActionMenu
            trigger={{ text: "Add" }}
            content={{
              title: "Add Affiliation",
              body: (close) => (
                <AddAffiliation
                  defaultType={filter !== "all" ? filter : "club"}
                  onClose={close}
                  onSubmit={onCreate}
                />
              ),
            }}
          />
        </>
      }
    >
      <>
        <Space style={{ marginBottom: 12 }} wrap>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as FilterValue)}
            options={[
              { value: "all", label: "All" },
              { value: "club", label: "Clubs" },
              { value: "province", label: "Provinces" },
              { value: "nation", label: "Nations" },
            ]}
          />
          <Input.Search
            aria-label="Search affiliations"
            placeholder="Search affiliations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
        </Space>
        <Table rowKey="id" dataSource={filtered} columns={columns} loading={loading} pagination={false} />
      </>
    </TableLayout>
  );
};
