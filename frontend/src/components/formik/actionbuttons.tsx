import { Box, Button } from "@mui/material";

export default function ActionButtons() {
  return (
    <Box display="flex-end" gap={2}>
      <Button variant="outlined" color="error">
        Cancel
      </Button>
      <Button variant="contained" color="primary">
        Submit
      </Button>
    </Box>
  );
}
