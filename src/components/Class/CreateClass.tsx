import { useState, useMemo } from "react";
import { Container, Typography, TextField, Button, Stack, Chip, Alert} from "@mui/material";
import { useClass } from "../../hooks/useClass";

const MAX_NAME = 100;

export default function CreateClass() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { create_class } = useClass();

  const nameError = useMemo(() => {
    const v = name.trim();
    if (!v) return "Class name is required";
    if (v.length > MAX_NAME) return `Max length is ${MAX_NAME} characters`;
    return null;
  }, [name]);

  const descError = useMemo(() => {
    const d = desc.trim();
    if (!d) return "Description is required";
    return null;
  }, [desc]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (nameError) {
      console.log("HELLOWORLD");
      setErrorMessage(nameError);
      return;
    }

    try {
      const res = await create_class({
        class_name: name.trim(),
        class_description: desc.trim(),
        tag: tags,
      });

        console.log("Create class response:", res);

      if (!res || !res.success) {
        setErrorMessage(`❌ ${res.message || "Registration failed. Please try again."}`);
        return;
      }

      setSuccessMessage("🎉 Class created successfully!");

      // Reset form
      setName("");
      setDesc("");
      setTags([]);
      setTagInput("");
    } catch (error) {
      console.error(error);
      setErrorMessage("❌ An unexpected error occurred during registration.");
    }
  };

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  return (
    <Container sx={{ py: 4 }}>
  <Typography variant="h4" gutterBottom>
    Create Class
  </Typography>

  <form onSubmit={handleSubmit}>
    <Stack spacing={2} sx={{ maxWidth: 520 }}>
      <TextField
        label="Class name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!nameError}
        helperText={nameError}
        required
        fullWidth
      />

      <TextField
        label="Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        multiline
        rows={3}
        fullWidth
      />

      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          label="Add tag"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" ? (e.preventDefault(), addTag()) : null
          }
        />
        <Button variant="outlined" onClick={addTag}>
          Add
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {tags.map((t) => (
          <Chip key={t} label={t} onDelete={() => removeTag(t)} />
        ))}
      </Stack>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Button type="submit" variant="contained">
        Save
      </Button>
    </Stack>
  </form>
</Container>

  );
}
