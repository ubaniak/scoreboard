import { Box, Divider, Stack, Typography } from "@mui/material";

export type PageLayoutProps = {
  title: string;
  subheading?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export const PageLayout = (props: PageLayoutProps) => {
  return (
    <Stack direction="column" spacing={2}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction={"column"}>
          <Typography variant="h3" component="h3">
            {props.title}
          </Typography>
          {props.subheading && (
            <Typography component="h6">{props.subheading}</Typography>
          )}
        </Stack>
        {props.actions && props.actions}
      </Stack>
      <Divider
        sx={{
          height: 5,
          background:
            "linear-gradient(90deg, transparent, #fbbf24, transparent)",
          my: 5,
        }}
      />
      <Box
        sx={{
          p: 2,
        }}
      >
        {props.children}
      </Box>
    </Stack>
  );
};
