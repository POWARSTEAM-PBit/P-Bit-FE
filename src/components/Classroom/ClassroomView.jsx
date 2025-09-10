import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ArrowBack, School, Group } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';
import styles from './ClassroomView.module.css';
// NOTE: we implement fetchClassMembers locally via client.get

export default function ClassroomView() {
  const { classroomId } = useParams();
  const navigate = useNavigate();

  // classroom context
  const { currentClassroom, classrooms, loading, error, renameClassroom } = useClassroom();
  const { isLoggedIn, user } = useAuth();

  const [classroomData, setClassroomData] = useState(null);

  // members state
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [members, setMembers] = useState([]);

  // sorting state
  const [sortBy, setSortBy] = useState('joined_at');
  const [order, setOrder] = useState('asc');

  // rename state (teacher only)
  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState('');

  // normalize route id once
  const wantedId = useMemo(() => String(classroomId ?? ''), [classroomId]);

  // helper to normalize a classroom object's id field
  const normId = (c) =>
    c?.id != null ? String(c.id) : c?.class_id != null ? String(c.class_id) : '';

  // make sure we only run remote fallback once
  const hasFetchedRef = useRef(false);

  // resolve classroom data from context or remote fallback
  useEffect(() => {
    if (!wantedId) {
      setClassroomData(null);
      return;
    }

    // prefer currentClassroom if matches
    if (currentClassroom && normId(currentClassroom) === wantedId) {
      setClassroomData(currentClassroom);
      setPendingName(currentClassroom?.name || '');
      return;
    }

    // else find in classrooms list
    const found = (classrooms || []).find((c) => normId(c) === wantedId);
    if (found) {
      setClassroomData(found);
      setPendingName(found?.name || '');
      return;
    }

    // fallback: fetch owned/enrolled once and pick the one we need
    let cancelled = false;
    (async () => {
      if (hasFetchedRef.current || !isLoggedIn) {
        if (!cancelled) setClassroomData(null);
        return;
      }
      try {
        hasFetchedRef.current = true;
        // choose endpoint by user role
        const endpoint =
          (user?.user_type || user?.userType || '').toString().toLowerCase() === 'teacher'
            ? '/class/owned'
            : '/class/enrolled';
        const resp = await client.get(endpoint);
        const list = resp?.data?.data || [];
        const f2 = list.find((c) => String(c.id) === wantedId);
        if (!cancelled) {
          if (f2) {
            // minimal transform to FE shape used here
            const transformed = {
              id: f2.id,
              name: f2.name,
              subject: f2.subject,
              description: f2.description,
              code: f2.passphrase,
              user_role:
                (user?.user_type || user?.userType || '').toString().toLowerCase() === 'teacher'
                  ? 'teacher'
                  : 'student',
              joined_at: f2.joined_at || f2.created_at,
              member_count: f2.member_count,
              owner_name: f2.owner_name,
            };
            setClassroomData(transformed);
            setPendingName(transformed?.name || '');
          } else {
            setClassroomData(null);
          }
        }
      } catch {
        if (!cancelled) setClassroomData(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wantedId, currentClassroom, classrooms, isLoggedIn, user]);

  // load members via backend
  useEffect(() => {
    if (!wantedId) return;

    let cancelled = false;

    async function loadMembers() {
      setMemberLoading(true);
      setMemberError('');
      try {
        // call GET /class/{id}/members with sort params
        const resp = await client.get(`/class/${wantedId}/members`, {
          params: { sort_by: sortBy, order },
        });
        const ok = resp?.data?.success;
        const list = ok ? resp?.data?.data : [];
        if (cancelled) return;

        const mapped = (list || []).map((u) => ({
          full_name: `${(u.first_name || '').trim()} ${(u.last_name || '').trim()}`.trim() || u.user_id,
          username: u.user_id,
          join_date: u.joined_at,
        }));
        setMembers(mapped);
      } catch (e) {
        if (cancelled) return;
        setMemberError(e?.message || 'Failed to load members');
        setMembers([]);
      } finally {
        if (!cancelled) setMemberLoading(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [wantedId, sortBy, order]);

  // keep pendingName in sync if classroom changes
  useEffect(() => {
    setPendingName(classroomData?.name || '');
  }, [classroomData?.name]);

  // role check for rename button
  const userType = (user?.user_type || user?.userType || '').toString().toLowerCase();
  const canEdit =
    userType === 'teacher' || (classroomData?.user_role || '').toString().toLowerCase() === 'teacher';

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // global loading/errors from context
  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={60} />
        <Typography variant="h6" className={styles.loadingText}>
          Loading classroom...
        </Typography>
      </Box>
    );
    }

  if (error) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <Alert severity="error" className={styles.alert}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          className={styles.backButton}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!classroomData) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <Alert severity="warning" className={styles.alert}>
          Classroom not found or you don't have access to it.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard')}
          className={styles.backButton}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Box className={styles.container}>
      <Container maxWidth="lg" className={styles.content}>
        {/* Header */}
        <Box className={styles.header}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            className={styles.backButton}
          >
            Back to Dashboard
          </Button>

          <Box className={styles.headerInfo}>
            {/* Title with rename controls (teacher only) */}
            <Box display="flex" alignItems="center" gap={1}>
              {!isEditingName ? (
                <>
                  <Typography variant="h4" component="h1" className={styles.title}>
                    {classroomData.name}
                  </Typography>
                  {canEdit && (
                    <Tooltip title="Rename class">
                      <IconButton
                        size="small"
                        onClick={() => setIsEditingName(true)}
                        aria-label="edit class name"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              ) : (
                <>
                  <TextField
                    size="small"
                    value={pendingName}
                    onChange={(e) => setPendingName(e.target.value)}
                    inputProps={{ maxLength: 100 }}
                    autoFocus
                  />
                  <Tooltip title="Save">
                    <IconButton
                      size="small"
                      aria-label="save class name"
                      onClick={async () => {
                        const newName = (pendingName || '').trim();
                        if (!newName) return;
                        const ok = await renameClassroom(classroomData.id, newName);
                        if (ok?.success || ok === true) {
                          setIsEditingName(false);
                          // optimistic local update
                          setClassroomData((prev) => (prev ? { ...prev, name: newName } : prev));
                        }
                      }}
                      disabled={!pendingName.trim()}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      aria-label="cancel rename"
                      onClick={() => {
                        setPendingName(classroomData?.name || '');
                        setIsEditingName(false);
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>

            <Box className={styles.headerMeta}>
              <Chip icon={<School />} label={classroomData.subject} color="primary" className={styles.subjectChip} />
              <Chip icon={<Group />} label={classroomData.user_role} color="secondary" className={styles.roleChip} />
            </Box>
          </Box>
        </Box>

        <Divider className={styles.divider} />

        {/* Classroom Info */}
        <Paper elevation={2} className={styles.classroomContent}>
          <Box className={styles.contentHeader}>
            <Typography variant="h5" component="h2" className={styles.contentTitle}>
              Classroom Information
            </Typography>
          </Box>

          <Box className={styles.infoGrid}>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Classroom Code
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {classroomData.code}
              </Typography>
            </Box>

            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Subject
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {classroomData.subject}
              </Typography>
            </Box>

            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Your Role
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {classroomData.user_role}
              </Typography>
            </Box>

            <Box className={styles.infoItem}>
              <Typography variant="subtitle2" color="textSecondary">
                Created
              </Typography>
              <Typography variant="h6" className={styles.infoValue}>
                {formatDate(classroomData.joined_at)}
              </Typography>
            </Box>
          </Box>

          {classroomData.description && (
            <Box className={styles.descriptionSection}>
              <Typography variant="h6" className={styles.descriptionTitle}>
                Description
              </Typography>
              <Typography variant="body1" className={styles.description}>
                {classroomData.description}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Enrolled Students */}
        <Paper elevation={2} className={styles.classroomContent} style={{ marginTop: 24 }}>
          <Box className={styles.contentHeader} display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" component="h2" className={styles.contentTitle}>
              Enrolled Students
            </Typography>

            <Box display="flex" alignItems="center" gap={8}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }}>
                <option value="joined_at">Join date</option>
                <option value="user_id">Username</option>
              </select>
              <select value={order} onChange={(e) => setOrder(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <Button
                variant="outlined"
                onClick={() => {
                  // re-trigger members fetch by toggling dependent state
                  setOrder((o) => (o === 'asc' ? 'asc' : 'desc'));
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* member states */}
          {memberLoading && (
            <Box display="flex" alignItems="center" gap={1} mt={2}>
              <CircularProgress size={20} />
              <Typography>Loading students…</Typography>
            </Box>
          )}

          {!memberLoading && memberError && <Alert severity="error" sx={{ mt: 2 }}>{memberError}</Alert>}

          {!memberLoading && !memberError && members.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>No students enrolled yet.</Alert>
          )}

          {!memberLoading && !memberError && members.length > 0 && (
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Full name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Join date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((s, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{s.full_name}</TableCell>
                      <TableCell>{s.username}</TableCell>
                      <TableCell>{s.join_date ? new Date(s.join_date).toLocaleString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Placeholder for future classroom features */}
        <Paper elevation={2} className={styles.featuresPlaceholder}>
          <Typography variant="h5" component="h2" className={styles.placeholderTitle}>
            Classroom Features Coming Soon
          </Typography>
          <Typography variant="body1" className={styles.placeholderText}>
            This classroom will soon include features like assignments, discussions,
            and interactive learning tools. Stay tuned for updates!
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
