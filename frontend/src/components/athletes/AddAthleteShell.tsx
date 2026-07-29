import { Segmented } from "antd";
import { useState } from "react";
import type { CreateAthleteProps } from "../../api/athletes";
import { BulkAddQueue } from "../shared/BulkAddQueue";
import { ImportCSV } from "../shared/ImportCSV";
import { AddAthlete } from "./AddAthlete";
import { AthleteFields } from "./AthleteFields";
import { toCreateAthleteProps } from "./toCreateAthleteProps";

const TEMPLATE =
  "name,dateOfBirth,gender,experience,clubAffiliationId,provinceAffiliationId,nationAffiliationId\nJane Smith,2005-03-15,female,open,,,\nJohn Doe,2007-08-22,male,novice,,,";

type Option = { value: number; label: string };

export type AddAthleteShellProps = {
  clubs: Option[];
  provinces: Option[];
  nations: Option[];
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: CreateAthleteProps) => Promise<unknown>;
  onImport: (file: File) => Promise<unknown>;
};

type Mode = "single" | "bulk" | "import";

export const AddAthleteShell = (props: AddAthleteShellProps) => {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div>
      <Segmented
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        style={{ marginBottom: 20 }}
        options={[
          { value: "single", label: "Add" },
          { value: "bulk", label: "Add Bulk" },
          { value: "import", label: "Upload CSV" },
        ]}
      />

      {mode === "single" && (
        <AddAthlete clubs={props.clubs} provinces={props.provinces} nations={props.nations} onClose={props.onClose} onSubmit={props.onSubmit} />
      )}

      {mode === "bulk" && (
        <BulkAddQueue<CreateAthleteProps>
          onClose={props.onClose}
          onSubmitAll={async (items) => {
            for (const item of items) {
              await props.onSubmit(toCreateAthleteProps(item));
            }
          }}
          renderFields={(form) => (
            <AthleteFields form={form} clubs={props.clubs} provinces={props.provinces} nations={props.nations} />
          )}
          renderQueueItem={(item) => item.name}
        />
      )}

      {mode === "import" && (
        <ImportCSV
          onClose={props.onClose}
          onImport={props.onImport}
          hint="Required: name. Optional: dateOfBirth, ageCategory, gender, experience, clubAffiliationId, provinceAffiliationId, nationAffiliationId"
          template={{ filename: "athletes-template.csv", content: TEMPLATE }}
        />
      )}
    </div>
  );
};
