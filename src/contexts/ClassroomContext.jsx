import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import client from '../api/client';

// Anonymous student session management
const ANONYMOUS_SESSION_KEY = 'pbit_anonymous_session';

const saveAnonymousSession = (sessionData) => {
  try {
    localStorage.setItem(ANONYMOUS_SESSION_KEY, JSON.stringify({
      ...sessionData,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save anonymous session:', error);
  }
};

const getAnonymousSession = () => {
  try {
    const sessionData = localStorage.getItem(ANONYMOUS_SESSION_KEY);
    if (!sessionData) return null;
    
    const parsed = JSON.parse(sessionData);
    
    // Check if session is still valid (24 hours)
    const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - parsed.timestamp > SESSION_DURATION) {
      clearAnonymousSession();
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to get anonymous session:', error);
    clearAnonymousSession();
    return null;
  }
};

const clearAnonymousSession = () => {
  try {
    localStorage.removeItem(ANONYMOUS_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear anonymous session:', error);
  }
};

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

  // Restore anonymous session on app startup
  const restoreAnonymousSession = useCallback(async () => {
    if (isLoggedIn) return; // Don't restore if user is logged in
    
    const sessionData = getAnonymousSession();
    if (!sessionData) return;
    
    try {
      // Verify the session is still valid by checking with the server
      const response = await client.post('/class/find-anonymous-user', {
        passphrase: sessionData.code,
        first_name: sessionData.first_name,
        pin_code: sessionData.pin_code
      });
      
      if (response.data.success && response.data.data) {
        const existingUser = response.data.data;
        const transformedClassroom = {
          id: existingUser.class_id,
          name: existingUser.class_name,
          subject: existingUser.subject,
          code: sessionData.code,
          user_role: 'student',
          joined_at: existingUser.joined_at,
          student_id: existingUser.student_id,
          first_name: existingUser.first_name,
          is_returning: true,
          is_cached: true // Flag to indicate this was restored from cache
        };
        
        setClassrooms(prev => {
          const exists = prev.find(c => c.id === transformedClassroom.id);
          return exists ? prev : [...prev, transformedClassroom];
        });
        setCurrentClassroom(transformedClassroom);
        
        console.log(`Welcome back, ${sessionData.first_name}! Your session has been restored.`);
      } else {
        // Session is no longer valid, clear it
        clearAnonymousSession();
      }
    } catch (error) {
      console.warn('Failed to restore anonymous session:', error);
      clearAnonymousSession();
    }
  }, [isLoggedIn]);

  // Fetch user's classrooms on mount and when user changes
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserClassrooms();
    } else if (!isLoggedIn) {
      // Try to restore anonymous session if not logged in
      restoreAnonymousSession();
    }
  }, [isLoggedIn, user, restoreAnonymousSession]);

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

      // First, try to find existing anonymous user with same name and PIN
      const findResponse = await client.post('/class/find-anonymous-user', joinData);
      
      if (findResponse.data.success && findResponse.data.data) {
        // User exists with correct name and PIN, log them back in
        const existingUser = findResponse.data.data;
        const transformedClassroom = {
          id: existingUser.class_id,
          name: existingUser.class_name,
          subject: existingUser.subject,
          code: passphrase,
          user_role: 'student',
          joined_at: existingUser.joined_at,
          student_id: existingUser.student_id,
          first_name: existingUser.first_name,
          is_returning: true
        };
        setClassrooms(prev => {
          const exists = prev.find(c => c.id === transformedClassroom.id);
          return exists ? prev : [...prev, transformedClassroom];
        });
        setCurrentClassroom(transformedClassroom);
        
        // Save session data for future restoration
        saveAnonymousSession({
          code: passphrase,
          first_name: firstName,
          pin_code: pinCode,
          student_id: existingUser.student_id,
          class_id: existingUser.class_id
        });
        
        return { success: true, classroom: transformedClassroom, isReturning: true };
      } else if (findResponse.data.error_type === 'name_exists') {
        // Name exists but PIN is wrong
        return { 
          success: false, 
          message: `A student named "${firstName}" already exists in this classroom. Please use the correct PIN or contact your teacher for assistance.`,
          errorType: 'name_exists'
        };
      } else {
        // User doesn't exist, create new anonymous user
        const response = await client.post('/class/join-anonymous', joinData);
        if (response.data.success) {
          const joinedClassroom = response.data.data;
          const transformedClassroom = {
            id: joinedClassroom.class_id,
            name: joinedClassroom.class_name,
            subject: joinedClassroom.subject,
            code: passphrase,
            user_role: 'student',
            joined_at: joinedClassroom.joined_at,
            student_id: joinedClassroom.student_id,
            first_name: joinedClassroom.first_name,
            is_returning: false
          };
          setClassrooms(prev => {
            const exists = prev.find(c => c.id === transformedClassroom.id);
            return exists ? prev : [...prev, transformedClassroom];
          });
          setCurrentClassroom(transformedClassroom);
          
          // Save session data for future restoration
          saveAnonymousSession({
            code: passphrase,
            first_name: firstName,
            pin_code: pinCode,
            student_id: joinedClassroom.student_id,
            class_id: joinedClassroom.class_id
          });
          
          return { success: true, classroom: transformedClassroom, isReturning: false };
        } else {
          setError(response.data.message);
          return { success: false, message: response.data.message };
        }
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
          // Clear anonymous session if leaving the current classroom
          clearAnonymousSession();
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

  const deleteClassroom = async (classroomId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.delete(`/class/${classroomId}`);
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
      const message = err.response?.data?.message || 'Failed to delete classroom';
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

  // Get anonymous students for a classroom (teachers only)
  const getAnonymousStudents = useCallback(async (classroomId) => {
    try {
      const response = await client.get(`/class/${classroomId}/anonymous-students`);
      if (response.data.success) {
        return { success: true, students: response.data.data };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch anonymous students';
      return { success: false, message };
    }
  }, []);

  // Update PIN for an anonymous student (teachers only)
  const updateStudentPin = useCallback(async (classroomId, studentId, newPin) => {
    try {
      const response = await client.put(`/class/${classroomId}/anonymous-student/${studentId}/pin`, {
        pin_code: newPin
      });
      if (response.data.success) {
        return { success: true, message: 'PIN updated successfully' };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update PIN';
      return { success: false, message };
    }
  }, []);

  // Remove student from classroom (teachers only)
  const removeStudentFromClassroom = useCallback(async (classroomId, studentId, studentType = 'registered') => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (studentType === 'anonymous') {
        // Use the dedicated endpoint for anonymous students
        response = await client.delete(`/class/${classroomId}/remove-anonymous-student/${studentId}`);
      } else {
        // For registered students
        response = await client.delete(`/class/${classroomId}/remove-student/${studentId}`);
      }
      
      if (response.data.success) {
        return { success: true, message: 'Student removed successfully' };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove student';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear anonymous session when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      clearAnonymousSession();
      // Clear any anonymous classrooms from state
      setClassrooms(prev => prev.filter(c => c.user_role !== 'student' || c.student_id));
      if (currentClassroom?.user_role === 'student' && currentClassroom?.student_id) {
        setCurrentClassroom(null);
      }
    }
  }, [isLoggedIn, user, currentClassroom]);

  // Get student-specific data (groups and devices)
  const getStudentData = useCallback(async (classroomId) => {
    try {
      // Check if user is logged in
      if (isLoggedIn && user) {
        // Use authenticated endpoint for registered users
        const response = await client.get(`/class/${classroomId}/student-data`);
        if (response.data.success) {
          return { success: true, data: response.data.data };
        } else {
          return { success: false, message: response.data.message };
        }
      } else {
        // Use anonymous endpoint for anonymous students
        const sessionData = getAnonymousSession();
        if (!sessionData) {
          return { success: false, message: 'No anonymous session found' };
        }
        
        const response = await client.get(`/class/${classroomId}/anonymous-student-data`, {
          params: {
            first_name: sessionData.first_name,
            pin_code: sessionData.pin_code
          }
        });
        
        if (response.data.success) {
          return { success: true, data: response.data.data };
        } else {
          return { success: false, message: response.data.message };
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch student data';
      return { success: false, message: errorMessage };
    }
  }, [isLoggedIn, user]);

  const value = {
    classrooms,
    currentClassroom,
    loading,
    error,
    createClassroom,
    joinClassroom,
    joinClassroomAnonymous,
    leaveClassroom,
    deleteClassroom,
    getClassroomByCode,
    getAnonymousStudents,
    updateStudentPin,
    removeStudentFromClassroom,
    getStudentData,
    setCurrentClassroom,
    clearError: () => setError(null),
    clearAnonymousSession,
    getAnonymousSession
  };

  return (
    <ClassroomContext.Provider value={value}>
      {children}
    </ClassroomContext.Provider>
  );
};
