import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Devices,
  BatteryChargingFull,
  BatteryCharging50,
  BatteryAlert,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import styles from './DeviceHeader.module.css';

const DeviceHeader = ({ 
  device, 
  deviceNickname, 
  onlineStatus, 
  batteryLevel, 
  getBatteryIcon,
  onBack 
}) => {
  const formatMacAddress = (macAddress) => {
    if (!macAddress) return '';
    return macAddress.replace(/(.{2})/g, '$1:').slice(0, -1);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box className={styles.header}>
        <Box className={styles.headerInfo}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Devices color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1" className={styles.deviceTitle}>
              {deviceNickname || device.nickname}
            </Typography>
          </Box>
          
          <Typography variant="body2" className={styles.macAddress}>
            MAC: {formatMacAddress(device.mac_address)}
          </Typography>
          
          <Box className={styles.statusChips}>
            <Chip
              icon={onlineStatus.icon}
              label={onlineStatus.text}
              color={onlineStatus.online ? "success" : "default"}
              variant={onlineStatus.online ? "filled" : "outlined"}
              size="small"
            />
            
            <Chip
              icon={getBatteryIcon(batteryLevel)}
              label={`${batteryLevel}%`}
              color={batteryLevel >= 30 ? "success" : "error"}
              variant="outlined"
              size="small"
            />
            
            <Chip
              icon={<Devices />}
              label={device.is_active ? "Active" : "Inactive"}
              color={device.is_active ? "success" : "default"}
              variant={device.is_active ? "filled" : "outlined"}
              size="small"
            />
          </Box>
        </Box>
        
        {onBack && (
          <Tooltip title="Go Back">
            <IconButton 
              onClick={onBack}
              className={styles.backButton}
              color="primary"
              size="large"
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

export default DeviceHeader;



