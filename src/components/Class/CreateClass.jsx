import { useState, useMemo } from "react";
import { Container, Typography, TextField, Button, Stack, Chip } from "@mui/material";
import { createClass } from "../../services/SaveClass";


const MAX_NAME = 100;

export default function CreateClass() {
  const [name, setName] = useState("");

  const nameError = useMemo(() => {
    const v = name.trim();
    if (!v) return "Class name is required";
    if (v.length > MAX_NAME) return `Max length is ${MAX_NAME} characters`;
    return null;
  }, [name]);

  const [desc, setDesc] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  function handleSubmit(e) {

    e.preventDefault();
    if (nameError) return; // Prevent submission if there is an error
    

    try {
        const newClass = createClass({name, description: desc,tags});

        alert(` New class successfully created! \nCode: ${newClass.code}`);
        setName("");
        setDesc("");
        setTags([]);
        setTagInput("");
    } catch (err) {
        if (err.code === "DUPLICATE_NAME") {
          alert(" This class already exists, try another name");
        } else {
          alert(" Something went wrong, please try again");
        }
    }
    
  }

function addTag() {
  const t = tagInput.trim();
  if (!t) return;
  //if (!tags.includes(t)) setTags([...tags, t]); // avoid tag duplication
  setTags([...tags, t]);
  setTagInput("");
}
function removeTag(t) {
  setTags(tags.filter(x => x !== t));
}
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Create Class</Typography>

      <Stack component="form" onSubmit={handleSubmitn} spacing={2} sx={{ maxWidth: 520 }}>
        <TextField
          label="Class name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!nameError}
          helperText={nameError || `${name.trim().length}/${MAX_NAME}`}
          slotProps={{
            input: { maxLength: MAX_NAME + 5 }
              }}
          required
          fullWidth
        />
        {/* Description (optional) */}
        <TextField
        label="Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        multiline
        rows={3}
        fullWidth
        />

        {/* Tags */}
        <Stack direction="row" spacing={1} alignItems="center">
        <TextField
            label="Add tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? (e.preventDefault(), addTag()) : null)}
        />
        <Button variant="outlined" onClick={addTag}>Add</Button>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
        {tags.map(t => (
            <Chip key={t} label={t} onDelete={() => removeTag(t)} />
        ))}
        </Stack>

        <Button type="submit" variant="contained" disabled={!!nameError}>
          Save
        </Button>
      </Stack>
    </Container>
  );
}
