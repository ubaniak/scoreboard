import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table, type TableProps } from "antd";
import { useState } from "react";
import type { Official } from "../../entities/cards";
import { EditOfficial } from "./edit";
import type { UpdateOfficialProps } from "../../api/officials";
import { ActionMenu } from "../actionMenu/actionMenu";

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

  const columns: TableProps<Official>["columns"] = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Nationality", dataIndex: "nationality", key: "nationality" },
    { title: "Gender", dataIndex: "gender", key: "gender", render: (v) => v ? <span style={{ textTransform: "capitalize" }}>{v}</span> : null },
    { title: "Year of Birth", dataIndex: "yearOfBirth", key: "yearOfBirth", render: (v) => v || null },
    { title: "Reg. Number", dataIndex: "registrationNumber", key: "registrationNumber" },
    { title: "Province", dataIndex: "province", key: "province" },
    { title: "Nation", dataIndex: "nation", key: "nation" },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => {
        return (
          <Space>
            <ActionMenu
              trigger={{ shape: "circle", icon: <EditOutlined />, ariaLabel: "Edit official" }}
              content={{
                title: "Edit Official",
                body: (close) => (
                  <EditOfficial
                    onClose={close}
                    onSubmit={(vals) => props.onEditOfficial(vals)}
                    official={record as Official}
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
        );
      },
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
      <Table
        dataSource={filtered}
        columns={columns}
        loading={props.loading}
      />
    </>
  );
};
