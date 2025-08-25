import { useEffect, useState } from "react";
import { Container, Typography, Card, CardContent, Button, CircularProgress, Alert, Stack } from "@mui/material";
import { useClass } from "../hooks/useClass";

export default function ClassList() {
  const { get_classes } = useClass();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await get_classes();
        if (!res || !res.success) {
          setError(res?.message || "Failed to load classes");
          return;
        }

        const sorted = (res.data ?? []).sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

setClasses(sorted);

      } catch (err) {
        console.error(err);
        setError("Unexpected error- can't load classes.");
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  if (loading) return <Container sx={{ py: 4 }}><CircularProgress /></Container>;
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>My Classes</Typography>
      {classes.length === 0 ? (
        <Stack spacing={2}>
          <Typography>You haven’t created any classes yet</Typography>
          <Button href="/create-class" variant="contained">Create Class</Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {/* Display as cards */}
          {classes.map((cls) => (
            <Card key={cls.class_id}>
              <CardContent>
                <Typography variant="h6">{cls.class_name}</Typography>
                <Typography>Subject: {cls.subject}</Typography>
                <Typography>Class Code: {cls.class_code}</Typography>
                <Typography>Students: {cls.enrolled_students}</Typography>
              </CardContent>
            </Card>
            {/*end of card */}

          ))}
        </Stack>
      )}
    </Container>
  );
}
