import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Space, Table, type TableProps } from "antd";
import { useState } from "react";
import {
  type Athlete,
  useMutateCreateAthlete,
  useMutateDeleteAthlete,
  useMutateUpdateAthlete,
  useListAthletes,
} from "../api/athletes";
import { useListClubs } from "../api/clubs";
import { ActionMenu } from "../components/actionMenu/actionMenu";
import { AddAthlete } from "../components/athletes/AddAthlete";
import { EditAthlete } from "../components/athletes/EditAthlete";
import { TableLayout } from "../layouts/table";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

type ClubOption = { value: number; label: string };

export const AthletesPage = () => {
  const { token } = useProfile();
  const [search, setSearch] = useState("");
  const athletes = useListAthletes({ token });
  const clubs = useListClubs({ token });
  const createAthlete = useMutateCreateAthlete({ token });
  const updateAthlete = useMutateUpdateAthlete({ token });
  const deleteAthlete = useMutateDeleteAthlete({ token });

  const clubOptions: ClubOption[] = (clubs.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  const columns: TableProps<Athlete>["columns"] = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Date of Birth", dataIndex: "dateOfBirth", key: "dateOfBirth" },
    { title: "Club", dataIndex: "clubName", key: "clubName" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined /> }}
            content={{
              title: "Edit Athlete",
              body: (close) => (
                <EditAthlete
                  athlete={record}
                  clubs={clubOptions}
                  onClose={close}
                  onSubmit={(vals) => updateAthlete.mutate({ id: record.id, toUpdate: vals })}
                />
              ),
            }}
          />
          <Popconfirm
            title="Delete this athlete?"
            onConfirm={() => deleteAthlete.mutate(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button danger shape="circle" icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="Athletes"
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "athletes" }]}
    >
      <TableLayout
        title="Athletes"
        actions={
          <ActionMenu
            trigger={{ text: "add" }}
            content={{
              title: "Add Athlete",
              body: (close) => (
                <AddAthlete
                  clubs={clubOptions}
                  onClose={close}
                  onSubmit={(vals) => createAthlete.mutate(vals)}
                />
              ),
            }}
          />
        }
      >
        <>
          <Input.Search
            placeholder="Search athletes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12 }}
            allowClear
          />
          <Table
            rowKey="id"
            dataSource={(athletes.data ?? []).filter((a) =>
              `${a.name} ${a.clubName ?? ""}`.toLowerCase().includes(search.toLowerCase())
            )}
            columns={columns}
            loading={athletes.isLoading}
          />
        </>
      </TableLayout>
    </PageLayout>
  );
};
