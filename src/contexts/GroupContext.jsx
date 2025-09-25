import React, { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client';

const GroupContext = createContext();

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};

export const GroupProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate random group name and icon
  const generateRandomGroupName = () => {
    const adjectives = [
      'Angry', 'Happy', 'Silly', 'Brave', 'Clever', 'Swift', 'Bright', 'Calm',
      'Daring', 'Eager', 'Fierce', 'Gentle', 'Honest', 'Jolly', 'Kind', 'Lively',
      'Mighty', 'Noble', 'Proud', 'Quick', 'Radiant', 'Smart', 'Tough', 'Wise'
    ];
    
    const animals = [
      'Cats', 'Dogs', 'Rabbits', 'Bears', 'Eagles', 'Lions', 'Tigers', 'Wolves',
      'Foxes', 'Owls', 'Dolphins', 'Sharks', 'Bees', 'Butterflies', 'Frogs', 'Turtles',
      'Penguins', 'Elephants', 'Giraffes', 'Monkeys', 'Zebras', 'Horses', 'Sheep', 'Pigs'
    ];

    const icons = [
      '🐱', '🐶', '🐰', '🐻', '🦅', '🦁', '🐅', '🐺',
      '🦊', '🦉', '🐬', '🦈', '🐝', '🦋', '🐸', '🐢',
      '🐧', '🐘', '🦒', '🐵', '🦓', '🐴', '🐑', '🐷'
    ];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    return {
      name: `${randomAdjective} ${randomAnimal}`,
      icon: randomIcon
    };
  };

  // Create a new group in a classroom
  const createGroup = useCallback(async (classroomId, customName = null) => {
    setLoading(true);
    setError(null);
    try {
      const groupData = customName ? 
        { name: customName, icon: '👥' } : 
        generateRandomGroupName();

      const response = await client.post(`/classroom/${classroomId}/groups`, groupData);
      
      if (response.data.success) {
        setGroups(prev => [...prev, response.data.data]);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create group';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all groups for a classroom
  const getClassroomGroups = useCallback(async (classroomId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/classroom/${classroomId}/groups`);
      if (response.data.success) {
        setGroups(response.data.data);
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch groups';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get students in a classroom
  const getClassroomStudents = useCallback(async (classroomId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/classroom/${classroomId}/students`);
      if (response.data.success) {
        setClassroomStudents(response.data.data);
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch students';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add student to group
  const addStudentToGroup = useCallback(async (classroomId, groupId, studentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post(`/classroom/${classroomId}/groups/${groupId}/students`, {
        student_id: studentId
      });
      
      if (response.data.success) {
        // Refresh groups and students
        await getClassroomGroups(classroomId);
        await getClassroomStudents(classroomId);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add student to group';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomGroups, getClassroomStudents]);

  // Remove student from group
  const removeStudentFromGroup = useCallback(async (classroomId, groupId, studentId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.delete(`/classroom/${classroomId}/groups/${groupId}/students/${studentId}`);
      
      if (response.data.success) {
        // Refresh groups and students
        await getClassroomGroups(classroomId);
        await getClassroomStudents(classroomId);
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to remove student from group';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomGroups, getClassroomStudents]);

  // Randomly distribute students to groups
  const randomlyDistributeStudents = useCallback(async (classroomId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post(`/classroom/${classroomId}/groups/random-distribute`);
      
      if (response.data.success) {
        // Refresh groups and students
        await getClassroomGroups(classroomId);
        await getClassroomStudents(classroomId);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to distribute students';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomGroups, getClassroomStudents]);

  // Update group name
  const updateGroupName = useCallback(async (classroomId, groupId, newName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.put(`/classroom/${classroomId}/groups/${groupId}`, {
        name: newName
      });
      
      if (response.data.success) {
        await getClassroomGroups(classroomId);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update group name';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomGroups]);

  // Delete group
  const deleteGroup = useCallback(async (classroomId, groupId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.delete(`/classroom/${classroomId}/groups/${groupId}`);
      
      if (response.data.success) {
        await getClassroomGroups(classroomId);
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete group';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomGroups]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
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
    generateRandomGroupName,
    clearError
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};
