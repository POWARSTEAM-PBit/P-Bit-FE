import React from "react";
import { Button, Container, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <Container style={{ padding: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/create-class")}
      >
        Create Class
      </Button>
    </Container>
  );
}
