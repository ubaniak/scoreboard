import { Grid } from "@mui/material";
import { Tile } from "../../components/tile/tile";
import { ListJudges } from "../../components/judge/list";
import type { Card } from "../../entities/cards";

type DevicesProps = {
  card?: Card;
};

export const Devices = ({ card }: DevicesProps) => {
  return (
    <Grid container spacing={4}>
      <Grid size={6}>
        <Tile header="Judges">
          <ListJudges numberOfJudges={card?.settings.numberOfJudges || 3} />
        </Tile>
      </Grid>
      <Grid size={6}>
        <Tile header="Scoreboard">hi</Tile>
      </Grid>
    </Grid>
  );
};
