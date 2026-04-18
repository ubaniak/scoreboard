import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Form, Input, Popconfirm, Space, Table, type TableProps } from "antd";
import { useState } from "react";
import {
  type Club,
  useMutateCreateClub,
  useMutateDeleteClub,
  useMutateUpdateClub,
  useListClubs,
} from "../api/clubs";
import { ActionMenu } from "../components/actionMenu/actionMenu";
import { TableLayout } from "../layouts/table";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

const AddClub = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: { name: string; location: string }) => void }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" onFinish={(v) => { onSubmit(v); onClose(); }}>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Location" name="location">
        <Input />
      </Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};

const EditClub = ({ club, onClose, onSubmit }: { club: Club; onClose: () => void; onSubmit: (v: { name?: string; location?: string }) => void }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" initialValues={club} onFinish={(v) => { onSubmit(v); onClose(); }}>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Location" name="location">
        <Input />
      </Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};

export const ClubsPage = () => {
  const { token } = useProfile();
  const [search, setSearch] = useState("");
  const clubs = useListClubs({ token });
  const createClub = useMutateCreateClub({ token });
  const updateClub = useMutateUpdateClub({ token });
  const deleteClub = useMutateDeleteClub({ token });

  const columns: TableProps<Club>["columns"] = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Location", dataIndex: "location", key: "location" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined /> }}
            content={{
              title: "Edit Club",
              body: (close) => (
                <EditClub
                  club={record}
                  onClose={close}
                  onSubmit={(vals) => updateClub.mutate({ id: record.id, toUpdate: vals })}
                />
              ),
            }}
          />
          <Popconfirm
            title="Delete this club?"
            onConfirm={() => deleteClub.mutate(record.id)}
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
      title="Clubs"
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "clubs" }]}
    >
      <TableLayout
        title="Clubs"
        actions={
          <ActionMenu
            trigger={{ text: "add" }}
            content={{
              title: "Add Club",
              body: (close) => (
                <AddClub
                  onClose={close}
                  onSubmit={(vals) => createClub.mutate(vals)}
                />
              ),
            }}
          />
        }
      >
        <>
          <Input.Search
            placeholder="Search clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12 }}
            allowClear
          />
          <Table
            rowKey="id"
            dataSource={(clubs.data ?? []).filter((c) =>
              `${c.name} ${c.location}`.toLowerCase().includes(search.toLowerCase())
            )}
            columns={columns}
            loading={clubs.isLoading}
          />
        </>
      </TableLayout>
    </PageLayout>
  );
};
