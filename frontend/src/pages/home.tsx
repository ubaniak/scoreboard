import { DeleteOutlined, EditOutlined, InboxOutlined, PictureOutlined } from "@ant-design/icons";
import { App as AntApp, Avatar, Button, Collapse, DatePicker, Form, Input, Popconfirm, Select, Space, Table, Upload, type TableProps, type UploadFile } from "antd";
import { ImageUpload } from "../components/image/imageUpload";
import dayjs from "dayjs";
import { useState } from "react";
import {
  type Club,
  useMutateCreateClub,
  useMutateDeleteClub,
  useMutateImportClubs,
  useMutateUpdateClub,
  useMutateUploadClubImage,
  useMutateRemoveClubImage,
  useListClubs,
} from "../api/clubs";
import {
  type Athlete,
  useMutateCreateAthlete,
  useMutateDeleteAthlete,
  useMutateImportAthletes,
  useMutateUpdateAthlete,
  useMutateUploadAthleteImage,
  useMutateRemoveAthleteImage,
  useListAthletes,
} from "../api/athletes";
import {
  useListCards,
  useMutateCreateCards,
  useMutateDeleteCard,
  useMutateUpdateCards,
  useMutateUploadCardImage,
  useMutateRemoveCardImage,
} from "../api/cards";
import { ActionMenu } from "../components/actionMenu/actionMenu";
import { CardIndex } from "../components/cards";
import { TableLayout } from "../layouts/table";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

// ----- Shared CSV import component -----

const ImportCSV = ({ onClose, onImport, hint }: { onClose: () => void; onImport: (f: File) => void; hint: string }) => {
  const { message } = AntApp.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [pending, setPending] = useState(false);

  const handleUpload = async () => {
    const file = fileList[0];
    if (!file) return;
    setPending(true);
    try {
      onImport(file as unknown as File);
      message.success(`Imported from ${file.name}`);
      setFileList([]);
      onClose();
    } catch (err) {
      message.error((err as Error).message || "Import failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Upload.Dragger
        accept=".csv"
        maxCount={1}
        fileList={fileList}
        beforeUpload={(file) => { setFileList([file]); return false; }}
        onRemove={() => setFileList([])}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Click or drag a CSV file to upload</p>
        <p className="ant-upload-hint">{hint}</p>
      </Upload.Dragger>
      <Space>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="primary" disabled={fileList.length === 0} loading={pending} onClick={handleUpload}>Import</Button>
      </Space>
    </Space>
  );
};

// ----- Clubs inline components -----

const AddClub = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: { name: string; location: string }) => void }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" onFinish={(v) => { onSubmit(v); onClose(); }}>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Location" name="location"><Input /></Form.Item>
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
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Location" name="location"><Input /></Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};

// ----- Athletes inline components -----

type ClubOption = { value: number; label: string };

const AddAthlete = ({ clubs, onClose, onSubmit }: { clubs: ClubOption[]; onClose: () => void; onSubmit: (v: { name: string; dateOfBirth: string; clubId?: number }) => void }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} layout="vertical" onFinish={(v) => {
      onSubmit({ ...v, dateOfBirth: v.dateOfBirth ? dayjs(v.dateOfBirth).format("YYYY-MM-DD") : "" });
      onClose();
    }}>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Date of Birth" name="dateOfBirth"><DatePicker style={{ width: "100%" }} /></Form.Item>
      <Form.Item label="Club" name="clubId"><Select options={clubs} allowClear placeholder="Select club..." /></Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};

const EditAthlete = ({ athlete, clubs, onClose, onSubmit }: { athlete: Athlete; clubs: ClubOption[]; onClose: () => void; onSubmit: (v: { name?: string; dateOfBirth?: string; clubId?: number; clearClub?: boolean }) => void }) => {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ ...athlete, dateOfBirth: athlete.dateOfBirth ? dayjs(athlete.dateOfBirth) : undefined }}
      onFinish={(v) => {
        const clearClub = v.clubId === undefined || v.clubId === null;
        onSubmit({
          name: v.name,
          dateOfBirth: v.dateOfBirth ? dayjs(v.dateOfBirth).format("YYYY-MM-DD") : undefined,
          clubId: clearClub ? undefined : v.clubId,
          clearClub,
        });
        onClose();
      }}
    >
      <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
      <Form.Item label="Date of Birth" name="dateOfBirth"><DatePicker style={{ width: "100%" }} /></Form.Item>
      <Form.Item label="Club" name="clubId"><Select options={clubs} allowClear placeholder="Select club..." /></Form.Item>
      <Space>
        <Button type="text" onClick={onClose}>Cancel</Button>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Space>
    </Form>
  );
};

// ----- Home page -----

export const HomePage = () => {
  const { token } = useProfile();

  const cards = useListCards({ token });
  const createCard = useMutateCreateCards({ token });
  const updateCard = useMutateUpdateCards({ token });
  const deleteCard = useMutateDeleteCard({ token });
  const uploadCardImage = useMutateUploadCardImage({ token });
  const removeCardImage = useMutateRemoveCardImage({ token });

  const clubsQuery = useListClubs({ token });
  const createClub = useMutateCreateClub({ token });
  const updateClub = useMutateUpdateClub({ token });
  const deleteClub = useMutateDeleteClub({ token });
  const importClubs = useMutateImportClubs({ token });
  const uploadClubImage = useMutateUploadClubImage({ token });
  const removeClubImage = useMutateRemoveClubImage({ token });

  const athletesQuery = useListAthletes({ token });
  const createAthlete = useMutateCreateAthlete({ token });
  const updateAthlete = useMutateUpdateAthlete({ token });
  const deleteAthlete = useMutateDeleteAthlete({ token });
  const importAthletes = useMutateImportAthletes({ token });
  const uploadAthleteImage = useMutateUploadAthleteImage({ token });
  const removeAthleteImage = useMutateRemoveAthleteImage({ token });

  const clubOptions: ClubOption[] = (clubsQuery.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  const clubColumns: TableProps<Club>["columns"] = [
    {
      title: "Name", key: "name",
      render: (_, record) => (
        <Space>
          <Avatar src={record.imageUrl} size="small">{record.name[0]}</Avatar>
          {record.name}
        </Space>
      ),
    },
    { title: "Location", dataIndex: "location", key: "location" },
    {
      title: "Action", key: "action",
      render: (_, record) => (
        <Space>
          <ActionMenu
            trigger={{ shape: "circle", icon: <PictureOutlined /> }}
            content={{ title: "Upload Image", body: () => <ImageUpload currentImageUrl={record.imageUrl} onUpload={(file) => uploadClubImage.mutate({ id: record.id, file })} onRemove={() => removeClubImage.mutate(record.id)} /> }}
          />
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined /> }}
            content={{ title: "Edit Club", body: (close) => <EditClub club={record} onClose={close} onSubmit={(vals) => updateClub.mutate({ id: record.id, toUpdate: vals })} /> }}
          />
          <Popconfirm title="Delete this club?" onConfirm={() => deleteClub.mutate(record.id)} okText="Delete" cancelText="Cancel">
            <Button danger shape="circle" icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const athleteColumns: TableProps<Athlete>["columns"] = [
    {
      title: "Name", key: "name",
      render: (_, record) => (
        <Space>
          <Avatar src={record.imageUrl} size="small">{record.name[0]}</Avatar>
          {record.name}
        </Space>
      ),
    },
    { title: "Date of Birth", dataIndex: "dateOfBirth", key: "dateOfBirth" },
    { title: "Club", dataIndex: "clubName", key: "clubName" },
    {
      title: "Action", key: "action",
      render: (_, record) => (
        <Space>
          <ActionMenu
            trigger={{ shape: "circle", icon: <PictureOutlined /> }}
            content={{ title: "Upload Image", body: () => <ImageUpload currentImageUrl={record.imageUrl} onUpload={(file) => uploadAthleteImage.mutate({ id: record.id, file })} onRemove={() => removeAthleteImage.mutate(record.id)} /> }}
          />
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined /> }}
            content={{ title: "Edit Athlete", body: (close) => <EditAthlete athlete={record} clubs={clubOptions} onClose={close} onSubmit={(vals) => updateAthlete.mutate({ id: record.id, toUpdate: vals })} /> }}
          />
          <Popconfirm title="Delete this athlete?" onConfirm={() => deleteAthlete.mutate(record.id)} okText="Delete" cancelText="Cancel">
            <Button danger shape="circle" icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout breadCrumbs={[{ title: "home" }]} title="Home page">
      <CardIndex
        isLoading={cards.isLoading || cards.isError}
        cards={cards.data}
        onCreateCard={(values) => createCard.mutate(values)}
        onUpdateCard={(values) => updateCard.mutate(values)}
        onDeleteCard={(id) => deleteCard.mutate(id)}
        onUploadCardImage={(id, file) => uploadCardImage.mutate({ id, file })}
        onRemoveCardImage={(id) => removeCardImage.mutate(id)}
      />
      <Collapse
        style={{ marginTop: 16 }}
        items={[
          {
            key: "clubs",
            label: "Clubs",
            children: (
              <TableLayout
                actions={
                  <>
                    <ActionMenu
                      trigger={{ text: "import" }}
                      content={{ title: "Import Clubs", body: (close) => <ImportCSV onClose={close} onImport={(f) => importClubs.mutate(f)} hint="Required columns: name. Optional: location" /> }}
                    />
                    <ActionMenu
                      trigger={{ text: "add" }}
                      content={{ title: "Add Club", body: (close) => <AddClub onClose={close} onSubmit={(vals) => createClub.mutate(vals)} /> }}
                    />
                  </>
                }
              >
                <Table rowKey="id" dataSource={clubsQuery.data ?? []} columns={clubColumns} loading={clubsQuery.isLoading} pagination={false} />
              </TableLayout>
            ),
          },
          {
            key: "athletes",
            label: "Athletes",
            children: (
              <TableLayout
                actions={
                  <>
                    <ActionMenu
                      trigger={{ text: "import" }}
                      content={{ title: "Import Athletes", body: (close) => <ImportCSV onClose={close} onImport={(f) => importAthletes.mutate(f)} hint="Required columns: name. Optional: dateOfBirth, clubId" /> }}
                    />
                    <ActionMenu
                      trigger={{ text: "add" }}
                      content={{ title: "Add Athlete", body: (close) => <AddAthlete clubs={clubOptions} onClose={close} onSubmit={(vals) => createAthlete.mutate(vals)} /> }}
                    />
                  </>
                }
              >
                <Table rowKey="id" dataSource={athletesQuery.data ?? []} columns={athleteColumns} loading={athletesQuery.isLoading} pagination={false} />
              </TableLayout>
            ),
          },
        ]}
      />
    </PageLayout>
  );
};
