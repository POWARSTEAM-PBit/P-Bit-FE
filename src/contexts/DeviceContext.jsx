import React, { createContext, useContext, useState, useCallback } from 'react';
import client from '../api/client';

const DeviceContext = createContext();

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};

export const DeviceProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const [classroomDevices, setClassroomDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Register a new P-Bit device
  const registerDevice = useCallback(async (macAddress, nickname) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post('/device/register', {
        mac_address: macAddress,
        nickname: nickname
      });
      
      if (response.data.success) {
        setDevices(prev => [...prev, response.data.data]);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to register device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all devices for the current user
  const getUserDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get('/device/user-devices');
      if (response.data.success) {
        setDevices(response.data.data);
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch devices';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get devices assigned to a specific classroom
  const getClassroomDevices = useCallback(async (classroomId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/device/classroom/${classroomId}/devices`);
      if (response.data.success) {
        setClassroomDevices(response.data.data);
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch classroom devices';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign device to classroom
  const assignDeviceToClassroom = useCallback(async (deviceId, classroomId, assignmentType, assignmentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.post(`/device/${deviceId}/assign`, {
        classroom_id: classroomId,
        assignment_type: assignmentType, // 'student' or 'group'
        assignment_id: assignmentId // student_id or group_id
      });
      
      if (response.data.success) {
        // Update classroom devices list
        await getClassroomDevices(classroomId);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to assign device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomDevices]);

  // Unassign device from classroom
  const unassignDeviceFromClassroom = useCallback(async (deviceId, classroomId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.delete(`/device/${deviceId}/unassign?classroom_id=${classroomId}`);
      
      if (response.data.success) {
        await getClassroomDevices(classroomId);
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to unassign device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomDevices]);

  // Update device assignment in classroom
  const updateDeviceAssignment = useCallback(async (deviceId, classroomId, assignmentType, assignmentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.put(`/device/${deviceId}/assignment?classroom_id=${classroomId}`, {
        classroom_id: classroomId,
        assignment_type: assignmentType, // 'student' or 'group'
        assignment_id: assignmentId // student_id or group_id
      });
      
      if (response.data.success) {
        // Update classroom devices list
        await getClassroomDevices(classroomId);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update device assignment';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getClassroomDevices]);

  // Delete device from user's account
  const deleteDevice = useCallback(async (deviceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.delete(`/device/${deviceId}`);
      
      if (response.data.success) {
        setDevices(prev => prev.filter(device => device.id !== deviceId));
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete device';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get device data for visualization
  const getDeviceData = useCallback(async (deviceId, timeRange = '24h') => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/device/${deviceId}/data?time_range=${timeRange}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch device data';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get device by MAC address (for direct access)
  const getDeviceByMacAddress = useCallback(async (macAddress) => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/device/mac/${macAddress}`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Device not found';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    devices,
    classroomDevices,
    loading,
    error,
    registerDevice,
    getUserDevices,
    getClassroomDevices,
    assignDeviceToClassroom,
    unassignDeviceFromClassroom,
    updateDeviceAssignment,
    deleteDevice,
    getDeviceData,
    getDeviceByMacAddress,
    clearError
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};
