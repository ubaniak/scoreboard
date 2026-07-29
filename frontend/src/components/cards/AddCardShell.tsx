import { Segmented } from "antd";
import { useState } from "react";
import type { CreateCardProps } from "../../api/cards";
import { BulkAddQueue } from "../shared/BulkAddQueue";
import { ImportCSV } from "../shared/ImportCSV";
import { AddCard } from "./add";
import { CardFields } from "./CardFields";

const TEMPLATE = `Name: Spring Open 2024
Date: 2024-04-20

Officials:
Name,Nationality,Year of Birth,Registration Number
Jane Smith,CAN,1985,REG001
John Doe,USA,1979,REG002

Bouts:
Bout Number,Bout Type,Red Athlete,Red Club,Blue Athlete,Blue Club,Age Category,Experience,Gender,Round Length,Glove Size
1,scored,Alice Johnson,Eastside Boxing,Bob Williams,Westside BC,u17,open,female,2,10oz
2,scored,Maria Garcia,Westside Club,John Doe,City Boxing,elite,open,male,3,12oz
3,sparring,Alice Brown,,Bob White,,u13,novice,male,1,10oz
`;

export type AddCardShellProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateCardProps) => Promise<unknown>;
  onImport?: (file: File) => Promise<unknown>;
};

type Mode = "single" | "bulk" | "import";

export const AddCardShell = (props: AddCardShellProps) => {
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
          ...(props.onImport ? [{ value: "import", label: "Upload CSV" }] : []),
        ]}
      />

      {mode === "single" && <AddCard onClose={props.onClose} onSubmit={props.onSubmit} />}

      {mode === "bulk" && (
        <BulkAddQueue<CreateCardProps>
          onClose={props.onClose}
          onSubmitAll={async (items) => {
            for (const item of items) {
              await props.onSubmit(item);
            }
          }}
          renderFields={() => <CardFields />}
          renderQueueItem={(item) => `${item.name} — ${item.date}`}
          initialValues={{ name: "", date: "" }}
        />
      )}

      {mode === "import" && props.onImport && (
        <ImportCSV
          onClose={props.onClose}
          onImport={props.onImport}
          hint="Imports card, officials, and bouts (athletes and clubs are created from bout rows)"
          template={{ filename: "card-import-template.csv", content: TEMPLATE }}
        />
      )}
    </div>
  );
};
