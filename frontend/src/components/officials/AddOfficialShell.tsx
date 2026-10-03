import { Segmented } from "antd";
import { useState } from "react";
import type { CreateOfficialProps } from "../../api/officials";
import { BulkAddQueue } from "../shared/BulkAddQueue";
import { ImportCSV } from "../shared/ImportCSV";
import { AddOfficial } from "./add";
import { OfficialFields } from "./OfficialFields";

const TEMPLATE = [
  "name,nationality,gender,yearOfBirth,registrationNumber",
  "Jane Smith,CAN,female,1985,REG001",
  "John Doe,USA,male,1979,REG002",
].join("\n");

export type AddOfficialShellProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateOfficialProps) => Promise<unknown>;
  onImport: (file: File) => Promise<unknown>;
};

type Mode = "single" | "bulk" | "import";

export const AddOfficialShell = (props: AddOfficialShellProps) => {
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
        <AddOfficial onClose={props.onClose} onSubmit={props.onSubmit} />
      )}

      {mode === "bulk" && (
        <BulkAddQueue<CreateOfficialProps>
          onClose={props.onClose}
          onSubmitAll={async (items) => {
            for (const item of items) {
              await props.onSubmit(item);
            }
          }}
          renderFields={() => <OfficialFields />}
          renderQueueItem={(item) => item.name}
        />
      )}

      {mode === "import" && (
        <ImportCSV
          onClose={props.onClose}
          onImport={props.onImport}
          hint="Required columns: name"
          template={{ filename: "officials-template.csv", content: TEMPLATE }}
        />
      )}
    </div>
  );
};
