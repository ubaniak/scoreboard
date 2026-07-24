import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Switch, Table, type TableProps } from "antd";
import type { RosterEntry } from "../../api/roster";

export type ListRosterProps = {
  entries?: RosterEntry[];
  loading?: boolean;
  onSetAvailable: (athleteId: number, available: boolean) => Promise<unknown>;
  onRemove: (athleteId: number) => Promise<unknown>;
};

export const ListRoster = (props: ListRosterProps) => {
  const { message } = App.useApp();

  const columns: TableProps<RosterEntry>["columns"] = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Age Category", dataIndex: "ageCategory", key: "ageCategory" },
    { title: "Experience", dataIndex: "experience", key: "experience" },
    {
      title: "Weight (kg)",
      dataIndex: "weightClass",
      key: "weightClass",
      render: (value?: number) => (value != null ? value : "-"),
    },
    {
      title: "Available",
      dataIndex: "available",
      key: "available",
      render: (available: boolean, record) => (
        <Switch
          checked={available}
          onChange={(checked) =>
            props.onSetAvailable(record.athleteId, checked).catch((err: unknown) => {
              message.error((err as Error).message || "Failed to update availability");
            })
          }
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Remove this athlete from the roster?"
          onConfirm={() =>
            props.onRemove(record.athleteId).catch((err: unknown) => {
              message.error((err as Error).message || "Failed to remove from roster");
            })
          }
          okText="Remove"
          cancelText="Cancel"
        >
          <Button danger shape="circle" icon={<DeleteOutlined />} aria-label="Remove from roster" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      loading={props.loading}
      dataSource={props.entries}
      rowKey="athleteId"
      columns={columns}
      scroll={{ x: "max-content" }}
    />
  );
};
