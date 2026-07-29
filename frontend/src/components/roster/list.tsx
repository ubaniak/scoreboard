import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Switch } from "antd";
import type { RosterEntry } from "../../api/roster";
import { RowList, type RowListColumn } from "../list/RowList";

export type ListRosterProps = {
  entries?: RosterEntry[];
  loading?: boolean;
  onSetAvailable: (athleteId: number, available: boolean) => Promise<unknown>;
  onRemove: (athleteId: number) => Promise<unknown>;
};

export const ListRoster = (props: ListRosterProps) => {
  const { message } = App.useApp();

  const columns: RowListColumn<RosterEntry>[] = [
    { key: "name", title: "Name", width: "1.6fr", render: (r) => r.name },
    { key: "gender", title: "Gender", width: "100px", render: (r) => r.gender },
    { key: "ageCategory", title: "Age Category", width: "120px", render: (r) => r.ageCategory },
    { key: "experience", title: "Experience", width: "100px", render: (r) => r.experience },
    {
      key: "weightClass",
      title: "Weight (kg)",
      width: "110px",
      render: (r) => (r.weightClass != null ? r.weightClass : "-"),
    },
    {
      key: "available",
      title: "Available",
      width: "100px",
      render: (r) => (
        <Switch
          checked={r.available}
          onChange={(checked) =>
            props.onSetAvailable(r.athleteId, checked).catch((err: unknown) => {
              message.error((err as Error).message || "Failed to update availability");
            })
          }
        />
      ),
    },
    {
      key: "action",
      width: "auto",
      render: (r) => (
        <Popconfirm
          title="Remove this athlete from the roster?"
          onConfirm={() =>
            props.onRemove(r.athleteId).catch((err: unknown) => {
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
    <RowList
      loading={props.loading}
      data={props.entries ?? []}
      rowKey={(r) => r.athleteId}
      columns={columns}
      emptyText="No athletes on the roster yet."
    />
  );
};
