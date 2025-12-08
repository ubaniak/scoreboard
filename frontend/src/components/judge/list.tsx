import { Chip, List } from "@mui/material";
import ToolboxListItem from "../listItm/ListItem";

export type ListJudgesProps = {
  numberOfJudges: number;
};

export const ListJudges = (props: ListJudgesProps) => {
  const judgeNumbers = [];
  for (let i = 1; i <= props.numberOfJudges; i++) {
    judgeNumbers.push(i);
  }
  const menuItems = [
    {
      label: "connect",
      onClick: (id: string) => {
        console.log(id);
      },
    },
  ];
  return (
    <List>
      {judgeNumbers.map((judge) => (
        <ToolboxListItem
          id={`${judge}`}
          primary={`Judge ${judge}`}
          secondary={
            <Chip
              label={"status"}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.75rem",
                height: 22,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            />
          }
          menuItems={menuItems}
        ></ToolboxListItem>
      ))}
    </List>
  );
};
