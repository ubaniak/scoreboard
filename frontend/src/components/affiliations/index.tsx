import { DeleteOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Segmented, Space, Tag } from "antd";
import { useMemo, useState } from "react";
import type {
  Affiliation,
  AffiliationType,
  CreateAffiliationProps,
  UpdateAffiliationProps,
} from "../../api/affiliations";
import { ActionMenu } from "../actionMenu/actionMenu";
import { ImageUpload } from "../image/imageUpload";
import { TableLayout } from "../../layouts/table";
import { RowList, RowThumbnail, type RowListColumn } from "../list/RowList";
import { AddAffiliationShell } from "./AddAffiliationShell";
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

  const columns: RowListColumn<Affiliation>[] = [
    { key: "thumb", width: "40px", render: (r) => <RowThumbnail name={r.name} imageUrl={r.imageUrl} /> },
    { key: "name", title: "Name", width: "1.6fr", render: (r) => r.name },
    {
      key: "type",
      title: "Type",
      width: "140px",
      render: (r) => <Tag>{TYPE_LABEL[r.type] ?? r.type}</Tag>,
    },
    {
      key: "actions",
      width: "auto",
      render: (r) => (
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
        <ActionMenu
          trigger={{ text: "Add" }}
          content={{
            title: "Add Affiliation",
            body: (close) => (
              <AddAffiliationShell
                defaultType={filter !== "all" ? filter : "club"}
                onClose={close}
                onSubmit={onCreate}
                onImport={onImport}
              />
            ),
          }}
          width={640}
        />
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
            style={{ width: "100%", maxWidth: 260 }}
          />
        </Space>
        <RowList rowKey={(r) => r.id} data={filtered} columns={columns} loading={loading} emptyText="No affiliations found." />
      </>
    </TableLayout>
  );
};
