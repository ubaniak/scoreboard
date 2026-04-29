import { DeleteOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { Avatar, Button, Input, Popconfirm, Space, Table, Tabs, type TableProps } from "antd";
import { useMemo, useState } from "react";
import { ImageUpload } from "../components/image/imageUpload";
import {
  useListAffiliations,
  useMutateCreateAffiliation,
  useMutateDeleteAffiliation,
  useMutateImportAffiliations,
  useMutateRemoveAffiliationImage,
  useMutateUpdateAffiliation,
  useMutateUploadAffiliationImage,
} from "../api/affiliations";
import {
  type Athlete,
  useListAthletes,
  useMutateCreateAthlete,
  useMutateDeleteAthlete,
  useMutateImportAthletes,
  useMutateRemoveAthleteImage,
  useMutateUpdateAthlete,
  useMutateUploadAthleteImage,
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
  useMutateImportCard,
  useMutateUpdateCards,
  useMutateUploadCardImage,
  useMutateRemoveCardImage,
} from "../api/cards";
import { ActionMenu } from "../components/actionMenu/actionMenu";
import { CardIndex } from "../components/cards";
import { ImportCSV } from "../components/shared/ImportCSV";
import { AddAthlete } from "../components/athletes/AddAthlete";
import { EditAthlete } from "../components/athletes/EditAthlete";
import { AffiliationIndex } from "../components/affiliations";
import { TableLayout } from "../layouts/table";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

type Option = { value: number; label: string };

export const HomePage = () => {
  const { token } = useProfile();
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
  const importCard = useMutateImportCard({ token });

  const affiliationsQuery = useListAffiliations({ token });
  const createAffiliation = useMutateCreateAffiliation({ token });
  const updateAffiliation = useMutateUpdateAffiliation({ token });
  const deleteAffiliation = useMutateDeleteAffiliation({ token });
  const uploadAffiliationImage = useMutateUploadAffiliationImage({ token });
  const removeAffiliationImage = useMutateRemoveAffiliationImage({ token });
  const importAffiliations = useMutateImportAffiliations({ token });

  const athletesQuery = useListAthletes({ token });
  const createAthlete = useMutateCreateAthlete({ token });
  const updateAthlete = useMutateUpdateAthlete({ token });
  const deleteAthlete = useMutateDeleteAthlete({ token });
  const importAthletes = useMutateImportAthletes({ token });
  const uploadAthleteImage = useMutateUploadAthleteImage({ token });
  const removeAthleteImage = useMutateRemoveAthleteImage({ token });

  const allAffiliations = useMemo(() => affiliationsQuery.data ?? [], [affiliationsQuery.data]);
  const clubOptions: Option[] = useMemo(
    () => allAffiliations.filter((a) => a.type === "club").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );
  const provinceOptions: Option[] = useMemo(
    () => allAffiliations.filter((a) => a.type === "province").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );
  const nationOptions: Option[] = useMemo(
    () => allAffiliations.filter((a) => a.type === "nation").map((a) => ({ value: a.id, label: a.name })),
    [allAffiliations],
  );

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
    { title: "Age Category", dataIndex: "ageCategory", key: "ageCategory" },
    { title: "Gender", dataIndex: "gender", key: "gender", render: (v) => v ? <span style={{ textTransform: "capitalize" }}>{v}</span> : null },
    { title: "Experience", dataIndex: "experience", key: "experience", render: (v) => v ? <span style={{ textTransform: "capitalize" }}>{v}</span> : null },
    { title: "Club", dataIndex: "clubName", key: "clubName" },
    { title: "Province", dataIndex: "provinceName", key: "provinceName" },
    { title: "Nation", dataIndex: "nationName", key: "nationName" },
    {
      title: "Actions", key: "action",
      render: (_, record) => (
        <Space>
          <ActionMenu
            trigger={{ shape: "circle", icon: <PictureOutlined />, ariaLabel: "Upload athlete image" }}
            content={{ title: "Upload Image", body: () => <ImageUpload currentImageUrl={record.imageUrl} onUpload={(file) => uploadAthleteImage.mutate({ id: record.id, file })} onRemove={() => removeAthleteImage.mutate(record.id)} /> }}
          />
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined />, ariaLabel: "Edit athlete" }}
            content={{
              title: "Edit Athlete",
              body: (close) => (
                <EditAthlete
                  athlete={record}
                  clubs={clubOptions}
                  provinces={provinceOptions}
                  nations={nationOptions}
                  onClose={close}
                  onSubmit={(vals) => updateAthlete.mutateAsync({ id: record.id, toUpdate: vals })}
                />
              ),
            }}
          />
          <Popconfirm title="Delete this athlete?" onConfirm={() => deleteAthlete.mutate(record.id)} okText="Delete" cancelText="Cancel">
            <Button danger shape="circle" icon={<DeleteOutlined />} aria-label="Delete athlete" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageLayout breadCrumbs={[{ title: "Home" }]} title="Home Page">
      <CardIndex
        isLoading={cards.isLoading || cards.isError}
        cards={cards.data}
        onCreateCard={(values) => createCard.mutateAsync(values)}
        onUpdateCard={(values) => updateCard.mutateAsync(values)}
        onDeleteCard={(id) => deleteCard.mutate(id)}
        onUploadCardImage={(id, file) => uploadCardImage.mutate({ id, file })}
        onRemoveCardImage={(id) => removeCardImage.mutate(id)}
        onImport={(file) => importCard.mutateAsync(file)}
      />
      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: "affiliations",
            label: `Affiliations (${allAffiliations.length})`,
            children: (
              <AffiliationIndex
                affiliations={allAffiliations}
                loading={affiliationsQuery.isLoading}
                onCreate={(vals) => createAffiliation.mutateAsync(vals)}
                onUpdate={(args) => updateAffiliation.mutateAsync(args)}
                onDelete={(id) => deleteAffiliation.mutate(id)}
                onUploadImage={(args) => uploadAffiliationImage.mutateAsync(args)}
                onRemoveImage={(id) => removeAffiliationImage.mutate(id)}
                onImport={(file) => importAffiliations.mutateAsync(file)}
              />
            ),
          },
          {
            key: "athletes",
            label: `Athletes (${athletesQuery.data?.length ?? 0})`,
            children: (
              <TableLayout
                actions={
                  <>
                    <ActionMenu
                      trigger={{ text: "Import" }}
                      content={{
                        title: "Import Athletes",
                        body: (close) => (
                          <ImportCSV
                            onClose={close}
                            onImport={(f) => importAthletes.mutateAsync(f)}
                            hint="Required: name. Optional: dateOfBirth, ageCategory, gender, experience, clubAffiliationId, provinceAffiliationId, nationAffiliationId"
                            template={{
                              filename: "athletes-template.csv",
                              content: "name,dateOfBirth,gender,experience,clubAffiliationId,provinceAffiliationId,nationAffiliationId\nJane Smith,2005-03-15,female,open,,,\nJohn Doe,2007-08-22,male,novice,,,",
                            }}
                          />
                        ),
                      }}
                    />
                    <ActionMenu
                      trigger={{ text: "Add" }}
                      content={{
                        title: "Add Athlete",
                        body: (close) => (
                          <AddAthlete
                            clubs={clubOptions}
                            provinces={provinceOptions}
                            nations={nationOptions}
                            onClose={close}
                            onSubmit={(vals) => createAthlete.mutateAsync(vals)}
                          />
                        ),
                      }}
                    />
                  </>
                }
              >
                <>
                  <Input.Search aria-label="Search athletes" placeholder="Search athletes…" value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} style={{ marginBottom: 12 }} allowClear />
                  <Table rowKey="id" dataSource={(athletesQuery.data ?? []).filter((a) => `${a.name} ${a.clubName ?? ""} ${a.provinceName ?? ""} ${a.nationName ?? ""}`.toLowerCase().includes(athleteSearch.toLowerCase()))} columns={athleteColumns} loading={athletesQuery.isLoading} pagination={false} />
                </>
              </TableLayout>
            ),
          },
          {
            key: "officials",
            label: `Officials (${officialsQuery.data?.length ?? 0})`,
            children: (
              <OfficialIndex
                loading={officialsQuery.isLoading}
                officials={officialsQuery.data}
                provinces={provinceOptions}
                nations={nationOptions}
                onCreateOfficial={(values) => createOfficial.mutateAsync(values)}
                onEditOfficial={(values) => updateOfficial.mutateAsync(values)}
                onDeleteOfficial={(id) => deleteOfficial.mutate(id)}
                onImport={(file) => importOfficials.mutateAsync(file)}
              />
            ),
          },
        ]}
      />
    </PageLayout>
  );
};
