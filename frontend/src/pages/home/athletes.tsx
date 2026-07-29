import { DeleteOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { Button, Input, Popconfirm, Space } from "antd";
import { useMemo, useState } from "react";
import { useListAffiliations } from "../../api/affiliations";
import {
  type Athlete,
  useListAthletes,
  useMutateCreateAthlete,
  useMutateDeleteAthlete,
  useMutateImportAthletes,
  useMutateRemoveAthleteImage,
  useMutateUpdateAthlete,
  useMutateUploadAthleteImage,
} from "../../api/athletes";
import { ActionMenu } from "../../components/actionMenu/actionMenu";
import { AddAthleteShell } from "../../components/athletes/AddAthleteShell";
import { EditAthlete } from "../../components/athletes/EditAthlete";
import { ImageUpload } from "../../components/image/imageUpload";
import { RowList, RowThumbnail, type RowListColumn } from "../../components/list/RowList";
import { TableLayout } from "../../layouts/table";
import { useProfile } from "../../providers/login";

type Option = { value: number; label: string };

export const HomeAthletesPage = () => {
  const { token } = useProfile();
  const [athleteSearch, setAthleteSearch] = useState("");

  const affiliationsQuery = useListAffiliations({ token });
  const athletesQuery = useListAthletes({ token });
  const createAthlete = useMutateCreateAthlete({ token });
  const updateAthlete = useMutateUpdateAthlete({ token });
  const deleteAthlete = useMutateDeleteAthlete({ token });
  const importAthletes = useMutateImportAthletes({ token });
  const uploadAthleteImage = useMutateUploadAthleteImage({ token });
  const removeAthleteImage = useMutateRemoveAthleteImage({ token });

  const allAffiliations = useMemo(
    () => affiliationsQuery.data ?? [],
    [affiliationsQuery.data],
  );
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

  const athleteColumns: RowListColumn<Athlete>[] = [
    { key: "thumb", width: "40px", render: (a) => <RowThumbnail name={a.name} imageUrl={a.imageUrl} /> },
    { key: "name", title: "Name", width: "1.4fr", render: (a) => a.name },
    { key: "ageCategory", title: "Age Category", width: "110px", render: (a) => a.ageCategory },
    {
      key: "gender",
      title: "Gender",
      width: "90px",
      render: (a) => (a.gender ? <span style={{ textTransform: "capitalize" }}>{a.gender}</span> : null),
    },
    {
      key: "experience",
      title: "Experience",
      width: "100px",
      render: (a) => (a.experience ? <span style={{ textTransform: "capitalize" }}>{a.experience}</span> : null),
    },
    { key: "clubName", title: "Club", width: "1fr", render: (a) => a.clubName },
    { key: "provinceName", title: "Province", width: "1fr", render: (a) => a.provinceName },
    { key: "nationName", title: "Nation", width: "1fr", render: (a) => a.nationName },
    {
      key: "action",
      width: "auto",
      render: (record) => (
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
    <TableLayout
      actions={
        <ActionMenu
          trigger={{ text: "Add" }}
          content={{
            title: "Add Athlete",
            body: (close) => (
              <AddAthleteShell
                clubs={clubOptions}
                provinces={provinceOptions}
                nations={nationOptions}
                onClose={close}
                onSubmit={(vals) => createAthlete.mutateAsync(vals)}
                onImport={(f) => importAthletes.mutateAsync(f)}
              />
            ),
          }}
          width={640}
        />
      }
    >
      <>
        <Input.Search aria-label="Search athletes" placeholder="Search athletes…" value={athleteSearch} onChange={(e) => setAthleteSearch(e.target.value)} style={{ marginBottom: 12 }} allowClear />
        <RowList
          rowKey={(a) => a.id}
          data={(athletesQuery.data ?? []).filter((a) => `${a.name} ${a.clubName ?? ""} ${a.provinceName ?? ""} ${a.nationName ?? ""}`.toLowerCase().includes(athleteSearch.toLowerCase()))}
          columns={athleteColumns}
          loading={athletesQuery.isLoading}
          emptyText="No athletes found."
        />
      </>
    </TableLayout>
  );
};
