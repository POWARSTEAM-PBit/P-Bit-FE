import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';

const ClassroomContext = createContext();

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};

export const ClassroomProvider = ({ children }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [currentClassroom, setCurrentClassroom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isLoggedIn } = useAuth();

  // Fetch user's classrooms on mount and when user changes
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserClassrooms();
    }
  }, [isLoggedIn, user]);

  // Fetch user profile on mount if token exists but no user
  useEffect(() => {
    if (isLoggedIn && !user) {
      // This will trigger the useAuth hook to fetch the profile
    }
  }, [isLoggedIn, user]);

  const fetchUserClassrooms = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get appropriate endpoint based on user role
      const endpoint = user?.user_type === 'teacher' ? '/class/owned' : '/class/enrolled';
      const response = await client.get(endpoint);
      
      if (response.data.success) {
        // Transform the data to match our frontend structure
        const transformedClassrooms = response.data.data.map(classroom => ({
          id: classroom.id,
          name: classroom.name,
          subject: classroom.subject,
          description: classroom.description,
          code: classroom.passphrase, // Backend uses 'passphrase', frontend expects 'code'
          pin_code: classroom.pin_code, // Include PIN code for teachers
          user_role: user?.user_type === 'teacher' ? 'teacher' : 'student',
          joined_at: classroom.joined_at || classroom.created_at,
          member_count: classroom.member_count,
          owner_name: classroom.owner_name
        }));
        setClassrooms(transformedClassrooms || []);
      }
    } catch (err) {
      setError('Failed to fetch classrooms');
      console.error('Error fetching classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClassroom = async (classroomData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post('/class/create', classroomData);
      if (response.data.success) {
        const newClassroom = response.data.data;
        // Transform to match frontend structure
        const transformedClassroom = {
          id: newClassroom.id,
          name: newClassroom.name,
          subject: newClassroom.subject,
          description: newClassroom.description,
          code: newClassroom.passphrase,
          pin_code: newClassroom.pin_code, // Include PIN code
          user_role: 'teacher',
          joined_at: newClassroom.created_at,
          member_count: 1,
          owner_name: user?.first_name + ' ' + user?.last_name
        };
        setClassrooms(prev => [...prev, transformedClassroom]);
        return { success: true, classroom: transformedClassroom };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create classroom';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const joinClassroom = async (passphrase) => {
    setLoading(true);
    setError(null);
    try {
      const joinData = { passphrase };

      const response = await client.post('/class/join', joinData);
      if (response.data.success) {
        const joinedClassroom = response.data.data;
        // Transform to match frontend structure
        const transformedClassroom = {
          id: joinedClassroom.class_id,
          name: joinedClassroom.class_name,
          subject: joinedClassroom.subject,
          code: passphrase,
          user_role: 'student',
          joined_at: joinedClassroom.joined_at
        };
        setClassrooms(prev => {
          const exists = prev.find(c => c.id === transformedClassroom.id);
          return exists ? prev : [...prev, transformedClassroom];
        });
        setCurrentClassroom(transformedClassroom);
        return { success: true, classroom: transformedClassroom };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to join classroom';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const joinClassroomAnonymous = async (passphrase, firstName, pinCode) => {
    setLoading(true);
    setError(null);
    try {
      const joinData = { 
        passphrase,
        first_name: firstName,
        pin_code: pinCode
      };

      const response = await client.post('/class/join-anonymous', joinData);
      if (response.data.success) {
        const joinedClassroom = response.data.data;
        // Transform to match frontend structure
        const transformedClassroom = {
          id: joinedClassroom.class_id,
          name: joinedClassroom.class_name,
          subject: joinedClassroom.subject,
          code: passphrase,
          user_role: 'student',
          joined_at: joinedClassroom.joined_at,
          student_id: joinedClassroom.student_id,
          first_name: joinedClassroom.first_name
        };
        setClassrooms(prev => {
          const exists = prev.find(c => c.id === transformedClassroom.id);
          return exists ? prev : [...prev, transformedClassroom];
        });
        setCurrentClassroom(transformedClassroom);
        return { success: true, classroom: transformedClassroom };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to join classroom';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const leaveClassroom = async (classroomId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.delete(`/class/${classroomId}/leave`);
      if (response.data.success) {
        setClassrooms(prev => prev.filter(c => c.id !== classroomId));
        if (currentClassroom?.id === classroomId) {
          setCurrentClassroom(null);
        }
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to leave classroom';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const getClassroomByCode = async (passphrase) => {
    setLoading(true);
    setError(null);
    try {
      // Since there's no direct endpoint to get class by passphrase,
      // we'll try to join it temporarily to get the class info
      const response = await client.post('/class/join', { passphrase });
      if (response.data.success) {
        const classroomData = response.data.data;
        const classroom = {
          id: classroomData.class_id,
          name: classroomData.class_name,
          subject: classroomData.subject,
          code: passphrase
        };
        return { success: true, classroom };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Classroom not found';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // --- added: rename classroom ---
  const renameClassroom = async (classroomId, newName) => {
    setLoading(true);
    setError(null);
    try {
      // call backend rename
      const res = await client.patch(`/class/${classroomId}/rename`, { name: newName });
      const ok = res?.data?.success;
      const updated = res?.data?.data;
      if (!ok || !updated) {
        const msg = res?.data?.message || 'Failed to rename class';
        setError(msg);
        return { success: false, message: msg };
      }

      // map backend -> frontend
      const transformed = {
        id: String(updated.id),
        name: updated.name,
        subject: updated.subject,
        description: updated.description,
        code: updated.passphrase,        // keep FE "code"
        passphrase: updated.passphrase,  // optional: for components using "passphrase"
        owner_id: updated.owner_id,
        created_at: updated.created_at,
      };

      // update list
      setClassrooms(prev =>
        (prev || []).map(c => (String(c.id) === String(classroomId) ? { ...c, ...transformed } : c))
      );

      // update current
      setCurrentClassroom(prev =>
        prev && String(prev.id) === String(classroomId) ? { ...prev, ...transformed } : prev
      );

      return { success: true, classroom: transformed };
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to rename class';
      setError(message);
      console.error('renameClassroom error:', err);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };
  // --- end added ---

  const value = {
    classrooms,
    currentClassroom,
    loading,
    error,
    createClassroom,
    joinClassroom,
    joinClassroomAnonymous,
    leaveClassroom,
    getClassroomByCode,
    setCurrentClassroom,
    renameClassroom, // expose rename action
    clearError: () => setError(null)
  };

  return (
    <ClassroomContext.Provider value={value}>
      {children}
    </ClassroomContext.Provider>
  );
};
