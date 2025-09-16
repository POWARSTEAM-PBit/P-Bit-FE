import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Paper
} from '@mui/material';
import {School, Add} from '@mui/icons-material';
import {useClassroom} from '../../contexts/ClassroomContext';
import styles from './CreateClassroom.module.css';

export default function CreateClassroom() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        subject: ''
    });
    const [errors, setErrors] = useState({});

    const {createClassroom, loading, error, clearError} = useClassroom();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Classroom name is required';
        }

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) {
            return;
        }

        const result = await createClassroom(formData);

        if (result.success) {
            navigate(`/classroom/${result.classroom.id}`);
        }
    };

    return (
        <Box className={styles.container}>
            <Paper elevation={3} className={styles.paper}>
                <Card className={styles.card}>
                    <CardContent className={styles.cardContent}>
                        <Box className={styles.header}>
                            <School className={styles.icon}/>
                            <Typography variant="h4" component="h1" className={styles.title}>
                                Create New Classroom
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" className={styles.alert}>
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <TextField
                                fullWidth
                                label="Classroom Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                className={styles.textField}
                                placeholder="e.g., Math 101 - Advanced Algebra"
                                required
                            />

                            <TextField
                                fullWidth
                                label="Subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                error={!!errors.subject}
                                helperText={errors.subject}
                                className={styles.textField}
                                placeholder="e.g., Mathematics, Science, English"
                                required
                            />

                            <TextField
                                fullWidth
                                label="Description (Optional)"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                multiline
                                rows={3}
                                className={styles.textField}
                                placeholder="Brief description of the classroom..."
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading}
                                className={styles.submitButton}
                                startIcon={loading ? <CircularProgress size={20}/> : <Add/>}
                            >
                                {loading ? 'Creating Classroom...' : 'Create Classroom'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </Paper>
        </Box>
    );
}