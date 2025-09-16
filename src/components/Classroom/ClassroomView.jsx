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
} from '@mui/material';
import { ArrowBack, School, Group } from '@mui/icons-material';

import { useClassroom } from '../../contexts/ClassroomContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ClassroomView.module.css';

import { fetchClassMembers } from '../../api/classMembers';
import IoTDataVisualization from '../IoT/IoTDataVisualization';
import AnonymousStudentManager from './AnonymousStudentManager';
import ClassroomDeviceManager from './ClassroomDeviceManager';
import GroupManager from './GroupManager';
import StudentGroupInfo from './StudentGroupInfo';

export default function ClassroomView() {
  const { classroomId } = useParams();
  const navigate = useNavigate();

  // Bring in classroom context pieces
  const { currentClassroom, classrooms, fetchClassrooms, loading, error } = useClassroom();
  const { isLoggedIn, user } = useAuth();

  const [classroomData, setClassroomData] = useState(null);

  // Members state
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [members, setMembers] = useState([]);

  // Sorting state
  const [sortBy, setSortBy] = useState('joined_at');
  const [order, setOrder] = useState('asc');

  // Normalize route id once
  const wantedId = useMemo(() => String(classroomId ?? ''), [classroomId]);

  // Determine if current user is a student or teacher
  // Check both AuthContext user and classroom user_role (for anonymous students)
  const isStudent = user?.user_type === 'student' || user?.role === 'student' || classroomData?.user_role === 'student';
  const isTeacher = user?.user_type === 'teacher' || user?.role === 'teacher' || classroomData?.user_role === 'teacher';
  

  // Helper to normalize a classroom object's id field
  const normId = (c) =>
    c?.id != null ? String(c.id) : c?.class_id != null ? String(c.class_id) : '';

  // Make sure we only call fetchClassrooms() once as a fallback
  const hasFetchedRef = useRef(false);

  // Resolve classroom data:
  // 1) prefer currentClassroom (if matches)
  // 2) else find in classrooms list
  // 3) else fetch list once and try again
  useEffect(() => {
    if (!wantedId) {
      setClassroomData(null);
      return;
    }

    // 1) currentClassroom
    if (currentClassroom && normId(currentClassroom) === wantedId) {
      setClassroomData(currentClassroom);
      return;
    }

    // 2) search in classrooms list
    const found = (classrooms || []).find((c) => normId(c) === wantedId);
    if (found) {
      setClassroomData(found);
      return;
    }

    // 3) fetch once if possible
    let cancelled = false;
    (async () => {
      if (hasFetchedRef.current || typeof fetchClassrooms !== 'function') {
        if (!cancelled) setClassroomData(null);
        return;
      }
      try {
        hasFetchedRef.current = true;
        const list = (await fetchClassrooms()) || [];
        if (cancelled) return;
        const f2 = list.find((c) => normId(c) === wantedId);
        setClassroomData(f2 || null);
      } catch {
        if (!cancelled) setClassroomData(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wantedId, currentClassroom, classrooms, fetchClassrooms]);

  // Fetch class members from backend (with cleanup to avoid setting state after unmount)
  useEffect(() => {
    if (!wantedId) return;

    let cancelled = false;

    async function loadMembers() {
      setMemberLoading(true);
      setMemberError('');
      try {
        const list = await fetchClassMembers(wantedId, { sort_by: sortBy, order });
        if (cancelled) return;

        // Map API response to required fields
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

  // Local sorting (kept even though server can sort; useful if backend ignores params)
  const sortedMembers = useMemo(() => {
    const dir = order === 'asc' ? 1 : -1;
    return [...members].sort((a, b) => {
      if (sortBy === 'full_name') return a.full_name.localeCompare(b.full_name) * dir;
      if (sortBy === 'user_id') return a.username.localeCompare(b.username) * dir;
      const ta = a.join_date ? new Date(a.join_date).getTime() : 0;
      const tb = b.join_date ? new Date(b.join_date).getTime() : 0;
      return (ta - tb) * dir;
    });
  }, [members, sortBy, order]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Global loading/errors from context
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
            <Typography variant="h4" component="h1" className={styles.title}>
              {classroomData.name}
            </Typography>
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

        {/* Conditional Content: IoT Data for Students, Enrolled Students for Teachers */}
        {isStudent ? (
          <>
            <StudentGroupInfo classroomId={wantedId} />
            <IoTDataVisualization />
          </>
        ) : (
          /* Enrolled Students - Teachers Only */
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
                    // Trigger refetch by toggling a dependency:
                    // simply re-setting state will re-run the effect since sort/order are deps.
                    setOrder((o) => (o === 'asc' ? 'asc' : 'desc'));
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {/* States: loading / error / empty / data */}
            {memberLoading && (
              <Box display="flex" alignItems="center" gap={1} mt={2}>
                <CircularProgress size={20} />
                <Typography>Loading students…</Typography>
              </Box>
            )}

            {!memberLoading && memberError && <Alert severity="error" sx={{ mt: 2 }}>{memberError}</Alert>}

            {!memberLoading && !memberError && sortedMembers.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>No students enrolled yet.</Alert>
            )}

            {!memberLoading && !memberError && sortedMembers.length > 0 && (
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
                    {sortedMembers.map((s, idx) => (
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
        )}

        {/* Anonymous Student Manager - Teachers Only */}
        {isTeacher && wantedId && (
          <AnonymousStudentManager classroomId={wantedId} />
        )}

        {/* Group Management - Teachers Only */}
        {isTeacher && wantedId && (
          <GroupManager classroomId={wantedId} />
        )}

        {/* Device Management - Teachers Only */}
        {isTeacher && wantedId && (
          <ClassroomDeviceManager classroomId={wantedId} />
        )}
      </Container>
    </Box>
  );
}
