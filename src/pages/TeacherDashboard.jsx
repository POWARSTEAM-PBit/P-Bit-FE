import React from "react";
import { Button, Container, Typography, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <Container style={{ padding: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>

      <Stack spacing={2} direction="row">
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/create-class")}
        >
          Create Class
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={() => navigate("/classes list")}
      >
        My Classes
      </Button>
    </Stack>
  </Container>
  );
}
