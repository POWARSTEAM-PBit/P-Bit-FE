// src/components/Connection.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
} from '@mui/material';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import SendIcon from '@mui/icons-material/Send';

export default function ConnectionView() {
  // Hardcoded UUIDs
  const serviceUUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  const characteristicUUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  
  const [deviceName, setDeviceName] = useState('');
  const [devicePrefix, setDevicePrefix] = useState('');
  const [acceptAll, setAcceptAll] = useState(true);
  const [logs, setLogs] = useState(['No logs yet...']);
  const [isRunning, setIsRunning] = useState(false);
  const [autoSendInterval, setAutoSendInterval] = useState(null);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const logsRef = useRef(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (autoSendInterval) {
        clearInterval(autoSendInterval);
      }
    };
  }, [autoSendInterval]);

  const log = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${msg}`;
    setLogs((prev) => {
      if (prev[0] === 'No logs yet...') return [logMessage];
      return [...prev, logMessage];
    });
    console.log(logMessage);
  };

  const normalizeUUID = (uuid) => {
    if (!uuid) return null;
    uuid = uuid.trim();

    if (uuid.startsWith('0x')) {
      const shortUuid = uuid.slice(2).padStart(4, '0').toLowerCase();
      return `0000${shortUuid}-0000-1000-8000-00805f9b34fb`;
    }

    if (uuid.length === 36) return uuid.toLowerCase();
    return uuid;
  };

  // Initial device selection - only called once
  const selectDevice = async () => {
    if (!navigator.bluetooth) {
      log("Web Bluetooth API is not available in this browser");
      return null;
    }

    try {
      const normalizedServiceUUID = normalizeUUID(serviceUUID) || '4fafc201-1fb5-459e-8fcc-c5c9c331914b';

      let filters = [];
      let optionalServices = [normalizedServiceUUID];

      if (!acceptAll) {
        if (deviceName.trim()) filters.push({ name: deviceName.trim() });
        if (devicePrefix.trim()) filters.push({ namePrefix: devicePrefix.trim() });
        if (normalizedServiceUUID) filters.push({ services: [normalizedServiceUUID] });
      }

      const options = acceptAll || filters.length === 0
        ? { acceptAllDevices: true, optionalServices }
        : { filters, optionalServices };

      log('Requesting device selection...');
      const device = await navigator.bluetooth.requestDevice(options);
      log(`Device selected: ${device.name || '[Unnamed]'}`);
      
      setSelectedDevice(device);
      return device;
    } catch (error) {
      log(`Device selection failed: ${error.toString()}`);
      return null;
    }
  };

  // Perform operation using the already-selected device
  const performSingleOperation = async (device = null) => {
    const targetDevice = device || selectedDevice;
    
    if (!targetDevice) {
      log("No device selected. Please select a device first.");
      return false;
    }

    let server = null;
    let service = null;
    let characteristic = null;

    try {
      log('Starting connection to selected device...');
      
      const normalizedServiceUUID = normalizeUUID(serviceUUID) || '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
      const normalizedCharacteristicUUID = normalizeUUID(characteristicUUID);

      // Connect to GATT server
      server = await targetDevice.gatt.connect();
      log('Connected to GATT Server');

      // Get service
      service = await server.getPrimaryService(normalizedServiceUUID);
      log('Service acquired');

      // Get characteristic
      characteristic = await service.getCharacteristic(normalizedCharacteristicUUID);
      log('Characteristic acquired');

      // Send request packet
      const requestPacket = new Uint8Array(7);
      requestPacket[0] = 0x01; // REQUEST_MSG
      requestPacket[1] = 0x00; // Dummy MAC
      requestPacket[2] = 0x11;
      requestPacket[3] = 0x22;
      requestPacket[4] = 0x33;
      requestPacket[5] = 0x44;
      requestPacket[6] = 0x55;

      await characteristic.writeValue(requestPacket);
      log('Request sent successfully');

      // Read response
      if (characteristic.properties.read) {
        const readValue = await characteristic.readValue();
        const bytes = new Uint8Array(readValue.buffer);
        
        log(`Response received: ${bytes.length} bytes`);
        
        // Parse response
        if (bytes.length >= 2) {
          const messageType = bytes[0];
          const errorCode = bytes[1];
          
          if (messageType === 0x02 && errorCode === 0) {
            log('Success response - parsing sensor data...');
            
            let byteIndex = 2;
            let sensorCount = 0;
            
            while (byteIndex + 2 < bytes.length) {
              const sensorType = bytes[byteIndex];
              const sensorValueLow = bytes[byteIndex + 1];
              const sensorValueHigh = bytes[byteIndex + 2];
              const sensorValue = sensorValueLow + (sensorValueHigh << 8);
              
              const sensorNames = {
                0x01: 'Temperature',
                0x02: 'Humidity', 
                0x03: 'Pressure',
                0x04: 'Light',
                0x05: 'Battery'
              };
              
              const sensorName = sensorNames[sensorType] || `Unknown(${sensorType})`;
              log(`${sensorName}: ${sensorValue}`);
              
              byteIndex += 3;
              sensorCount++;
            }
            
            log(`Parsed ${sensorCount} sensors successfully`);
          } else {
            log(`Error response: Type=0x${messageType.toString(16)}, Error=${errorCode}`);
          }
        }
      }

      setSuccessCount(prev => prev + 1);
      return true;

    } catch (error) {
      log(`Operation failed: ${error.toString()}`);
      setFailureCount(prev => prev + 1);
      return false;
    } finally {
      // Always disconnect
      try {
        if (targetDevice && targetDevice.gatt.connected) {
          targetDevice.gatt.disconnect();
          log('Disconnected');
        }
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  };

  const startAutoOperations = async () => {
    // First, select device if not already selected
    let device = selectedDevice;
    if (!device) {
      device = await selectDevice();
      if (!device) return;
    }

    if (autoSendInterval) {
      clearInterval(autoSendInterval);
    }

    setIsRunning(true);
    log('Starting automatic operations every 20 seconds...');
    
    // Perform initial operation
    await performSingleOperation(device);
    
    const interval = setInterval(async () => {
      if (isRunning) {
        await performSingleOperation(device);
      }
    }, 20000);

    setAutoSendInterval(interval);
  };

  const stopAutoOperations = () => {
    if (autoSendInterval) {
      clearInterval(autoSendInterval);
      setAutoSendInterval(null);
    }
    setIsRunning(false);
    log('Stopped automatic operations');
  };

  const resetStats = () => {
    setSuccessCount(0);
    setFailureCount(0);
    setLogs(['No logs yet...']);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          padding: 4,
          borderRadius: 4,
          backgroundColor: '#fafafa',
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          <BluetoothIcon sx={{ mr: 1 }} />
          Bluetooth Device Scanner & Sender
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
          Service UUID: {serviceUUID}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Characteristic UUID: {characteristicUUID}
        </Typography>

        <TextField
          label="Device Name (Optional)"
          fullWidth
          margin="normal"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />

        <TextField
          label="Device Name Prefix (Optional)"
          fullWidth
          margin="normal"
          value={devicePrefix}
          onChange={(e) => setDevicePrefix(e.target.value)}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={acceptAll}
              onChange={(e) => setAcceptAll(e.target.checked)}
            />
          }
          label="Accept All Devices"
          sx={{ mt: 1 }}
        />

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {!selectedDevice ? (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<SendIcon />}
              onClick={selectDevice}
            >
              Select Bluetooth Device
            </Button>
          ) : (
            <>
              {!isRunning ? (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={startAutoOperations}
                >
                  Start Auto-Operations (Every 20s)
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  onClick={stopAutoOperations}
                >
                  Stop Auto-Operations
                </Button>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => performSingleOperation()}
                  disabled={isRunning}
                >
                  Single Operation
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  onClick={() => setSelectedDevice(null)}
                >
                  Change Device
                </Button>
              </Box>
            </>
          )}

          <Button
            variant="outlined"
            color="info"
            fullWidth
            onClick={resetStats}
          >
            Reset Stats
          </Button>
        </Box>

        <Alert severity={selectedDevice ? (isRunning ? "success" : "info") : "warning"} sx={{ mt: 2 }}>
          {!selectedDevice ? (
            "No device selected"
          ) : (
            <>
              Device: {selectedDevice.name || '[Unnamed]'}
              <br />
              Status: {isRunning ? "Running auto-operations" : "Ready"}
              <br />
              Success: {successCount} | Failures: {failureCount}
              {successCount + failureCount > 0 && (
                <span> | Success Rate: {Math.round((successCount / (successCount + failureCount)) * 100)}%</span>
              )}
            </>
          )}
        </Alert>

        <Typography variant="h6" sx={{ mt: 4 }}>
          Logs
        </Typography>

        <Box
          ref={logsRef}
          sx={{
            backgroundColor: '#f0f0f0',
            padding: 2,
            borderRadius: 2,
            maxHeight: 400,
            overflowY: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            border: '1px solid #ccc',
            mt: 1,
            fontSize: '0.8rem',
          }}
        >
          {logs.join('\n')}
        </Box>
      </Box>
    </Container>
  );
}