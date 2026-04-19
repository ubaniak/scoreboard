import { DeleteOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { Avatar, Button, Collapse, Input, Popconfirm, Space, Table, type TableProps } from "antd";
import { ImageUpload } from "../components/image/imageUpload";
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
  useGetOfficials,
  useMutateCreateOfficial,
  useMutateDeleteOfficial,
  useMutateImportOfficials,
  useMutateUpdateOfficial,
} from "../api/officials";
import { OfficialIndex } from "../components/officials";
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
import { ImportCSV } from "../components/shared/ImportCSV";
import { AddClub } from "../components/clubs/AddClub";
import { EditClub } from "../components/clubs/EditClub";
import { AddAthlete } from "../components/athletes/AddAthlete";
import { EditAthlete } from "../components/athletes/EditAthlete";
import { TableLayout } from "../layouts/table";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

type ClubOption = { value: number; label: string };

export const HomePage = () => {
  const { token } = useProfile();
  const [clubSearch, setClubSearch] = useState("");
  const [athleteSearch, setAthleteSearch] = useState("");

  const officialsQuery = useGetOfficials({ token });
  const createOfficial = useMutateCreateOfficial({ token });
  const updateOfficial = useMutateUpdateOfficial({ token });
  const deleteOfficial = useMutateDeleteOfficial({ token });
  const importOfficials = useMutateImportOfficials({ token });

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
                <>
                  <Input.Search placeholder="Search clubs..." value={clubSearch} onChange={(e) => setClubSearch(e.target.value)} style={{ marginBottom: 12 }} allowClear />
                  <Table rowKey="id" dataSource={(clubsQuery.data ?? []).filter((c) => `${c.name} ${c.location}`.toLowerCase().includes(clubSearch.toLowerCase()))} columns={clubColumns} loading={clubsQuery.isLoading} pagination={false} />
                </>
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
                <>
                  <Input.Search placeholder="Search athletes..." value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} style={{ marginBottom: 12 }} allowClear />
                  <Table rowKey="id" dataSource={(athletesQuery.data ?? []).filter((a) => `${a.name} ${a.clubName ?? ""}`.toLowerCase().includes(athleteSearch.toLowerCase()))} columns={athleteColumns} loading={athletesQuery.isLoading} pagination={false} />
                </>
              </TableLayout>
            ),
          },
          {
            key: "officials",
            label: "Officials",
            children: (
              <OfficialIndex
                loading={officialsQuery.isLoading}
                officials={officialsQuery.data}
                onCreateOfficial={(values) => createOfficial.mutate(values)}
                onEditOfficial={(values) => updateOfficial.mutate(values)}
                onDeleteOfficial={(id) => deleteOfficial.mutate(id)}
                onImport={(file) => importOfficials.mutate(file)}
              />
            ),
          },
        ]}
      />
    </PageLayout>
  );
};
