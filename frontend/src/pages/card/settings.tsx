import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  Typography,
} from "@mui/material";
import { ListOfficials } from "../../components/officials/list";
import type { Card } from "../../entities/cards";

export type SettingsProps = {
  card?: Card;
};
export const Settings = (props: SettingsProps) => {
  return (
    <Grid container spacing={4} direction="column">
      <Grid size={10}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="span">Officials</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ListOfficials card={props.card!} />
          </AccordionDetails>
        </Accordion>
      </Grid>
      <Grid size={10}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="span">Bouts</Typography>
          </AccordionSummary>
          <AccordionDetails>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            malesuada lacus ex, sit amet blandit leo lobortis eget.
          </AccordionDetails>
        </Accordion>
      </Grid>
    </Grid>
  );
};
