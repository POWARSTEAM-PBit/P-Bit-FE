import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Shuffle as ShuffleIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import { useGroup } from '../../contexts/GroupContext';

const GroupManager = ({ classroomId }) => {
  const { 
    groups, 
    classroomStudents, 
    loading, 
    error, 
    createGroup, 
    getClassroomGroups, 
    getClassroomStudents, 
    addStudentToGroup, 
    removeStudentFromGroup, 
    randomlyDistributeStudents, 
    updateGroupName, 
    deleteGroup, 
    clearError 
  } = useGroup();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [customName, setCustomName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    if (classroomId) {
      getClassroomGroups(classroomId);
      getClassroomStudents(classroomId);
    }
  }, [classroomId, getClassroomGroups, getClassroomStudents]);

  const handleCreateGroup = async (useCustomName = false) => {
    const result = await createGroup(classroomId, useCustomName ? customName : null);
    
    if (result.success) {
      setShowCreateDialog(false);
      setCustomName('');
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    const result = await updateGroupName(classroomId, editingGroup.id, newGroupName.trim());
    
    if (result.success) {
      setShowEditDialog(false);
      setEditingGroup(null);
      setNewGroupName('');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group? All students will be unassigned.')) {
      await deleteGroup(classroomId, groupId);
    }
  };

  const handleRandomDistribution = async () => {
    if (window.confirm('This will randomly distribute all students to existing groups. Continue?')) {
      await randomlyDistributeStudents(classroomId);
    }
  };

  const handleAddStudentToGroup = async (groupId, studentId) => {
    await addStudentToGroup(classroomId, groupId, studentId);
  };

  const handleRemoveStudentFromGroup = async (groupId, studentId) => {
    await removeStudentFromGroup(classroomId, groupId, studentId);
  };

  const openMenu = (event, group) => {
    setAnchorEl(event.currentTarget);
    setSelectedGroup(group);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedGroup(null);
  };

  const openEditDialog = (group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setShowEditDialog(true);
    closeMenu();
  };

  const getStudentsInGroup = (groupId) => {
    return classroomStudents.filter(student => student.group_id === groupId);
  };

  const getUnassignedStudents = () => {
    return classroomStudents.filter(student => !student.group_id);
  };

  const unassignedStudents = getUnassignedStudents();

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            👥 Student Groups
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={handleRandomDistribution}
              disabled={loading || groups.length === 0 || classroomStudents.length === 0}
            >
              Random Distribute
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
              disabled={loading}
            >
              Create Group
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {groups.length === 0 ? (
          <Box textAlign="center" py={4}>
            <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No groups created yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create groups to organize your students
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {groups.map((group) => {
              const studentsInGroup = getStudentsInGroup(group.id);
              
              return (
                <Grid item xs={12} md={6} key={group.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h6" component="h3">
                            {group.icon} {group.name}
                          </Typography>
                          <Chip 
                            label={`${studentsInGroup.length} students`} 
                            size="small" 
                            color="primary"
                          />
                        </Box>
                        <IconButton
                          onClick={(e) => openMenu(e, group)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {studentsInGroup.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No students assigned to this group
                        </Typography>
                      ) : (
                        <List dense>
                          {studentsInGroup.map((student) => (
                            <ListItem key={student.id} sx={{ px: 0 }}>
                              <ListItemText
                                primary={student.first_name || student.name}
                                secondary={student.email || 'Anonymous student'}
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  onClick={() => handleRemoveStudentFromGroup(group.id, student.id)}
                                  size="small"
                                >
                                  <PersonRemoveIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Unassigned Students */}
        {unassignedStudents.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Unassigned Students ({unassignedStudents.length})
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <List dense>
                {unassignedStudents.map((student) => (
                  <ListItem key={student.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={student.first_name || student.name}
                      secondary={student.email || 'Anonymous student'}
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        {groups.map((group) => (
                          <Tooltip key={group.id} title={`Add to ${group.name}`}>
                            <IconButton
                              size="small"
                              onClick={() => handleAddStudentToGroup(group.id, student.id)}
                            >
                              <PersonAddIcon />
                            </IconButton>
                          </Tooltip>
                        ))}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Create Group Dialog */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose how to create your group:
            </Typography>
            <Box display="flex" gap={2} mb={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleCreateGroup(false)}
                disabled={loading}
              >
                Random Name & Icon
              </Button>
            </Box>
            <TextField
              fullWidth
              label="Custom Group Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter custom group name"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleCreateGroup(true)}
              disabled={loading || !customName.trim()}
            >
              Create with Custom Name
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog 
        open={showEditDialog} 
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Group Name</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditGroup} 
            variant="contained"
            disabled={loading || !newGroupName.trim()}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
      >
        <MenuItem onClick={() => openEditDialog(selectedGroup)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Name
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleDeleteGroup(selectedGroup.id);
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Group
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default GroupManager;
