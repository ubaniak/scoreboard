import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Space } from "antd";
import { useState } from "react";
import type { Official } from "../../entities/cards";
import { EditOfficial } from "./edit";
import type { UpdateOfficialProps } from "../../api/officials";
import { ActionMenu } from "../actionMenu/actionMenu";
import { RowList, type RowListColumn } from "../list/RowList";

type Option = { value: number; label: string };

export type ListOfficialsProps = {
  officials?: Official[];
  loading?: boolean;
  provinces: Option[];
  nations: Option[];
  onEditOfficial: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => Promise<unknown>;
  onDeleteOfficial?: (officialId: string) => void;
};

export const ListOfficials = (props: ListOfficialsProps) => {
  const [search, setSearch] = useState("");

  const filtered = (props.officials || []).filter((o) => {
    const q = search.toLowerCase();
    return (
      o.name?.toLowerCase().includes(q) ||
      o.nationality?.toLowerCase().includes(q) ||
      o.registrationNumber?.toLowerCase().includes(q)
    );
  });

  const columns: RowListColumn<Official>[] = [
    { key: "name", title: "Name", width: "1.6fr", render: (o) => o.name },
    { key: "nationality", title: "Nationality", width: "1fr", render: (o) => o.nationality },
    {
      key: "gender",
      title: "Gender",
      width: "90px",
      render: (o) => (o.gender ? <span style={{ textTransform: "capitalize" }}>{o.gender}</span> : null),
    },
    { key: "yearOfBirth", title: "Year of Birth", width: "110px", render: (o) => o.yearOfBirth || null },
    { key: "registrationNumber", title: "Reg. Number", width: "130px", render: (o) => o.registrationNumber },
    { key: "province", title: "Province", width: "1fr", render: (o) => o.province },
    { key: "nation", title: "Nation", width: "1fr", render: (o) => o.nation },
    {
      key: "action",
      width: "auto",
      render: (record) => (
        <Space>
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined />, ariaLabel: "Edit official" }}
            content={{
              title: "Edit Official",
              body: (close) => (
                <EditOfficial
                  onClose={close}
                  onSubmit={(vals) => props.onEditOfficial(vals)}
                  official={record}
                  provinces={props.provinces}
                  nations={props.nations}
                />
              ),
            }}
          />
          {props.onDeleteOfficial && (
            <Popconfirm
              title="Delete this official?"
              onConfirm={() => props.onDeleteOfficial!(record.id)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button danger shape="circle" icon={<DeleteOutlined />} aria-label="Delete official" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Input.Search
        placeholder="Search officials…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        allowClear
      />
      <RowList data={filtered} columns={columns} loading={props.loading} rowKey={(o) => o.id} emptyText="No officials found." />
    </>
  );
};
