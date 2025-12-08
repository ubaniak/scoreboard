import { Box, Container } from "@mui/material";
import { Outlet } from "@tanstack/react-router";

export const AppLayout = () => {
  return (
    <Box
      sx={{
        // minHeight: "100vh", // fallback
        width: "100vw", // or just width: '100%'
        height: "100%",
        margin: 0,
        padding: 0,
        bgcolor: "#374151", // gray-600 background
        color: "#000000", // black text
        display: "flex",
      }}
    >
      <Box
        sx={{
          borderRadius: 4,
          bgcolor: "white",
          height: "90%", // Also works
          width: "100%",
          margin: 4,
          p: 4,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        <Container>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};
