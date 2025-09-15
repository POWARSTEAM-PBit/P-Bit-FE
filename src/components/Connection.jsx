import React, { useState, useRef, useEffect } from 'react';

export default function ConnectionView() {
  const [serviceUUID, setServiceUUID] = useState('');
  const [characteristicUUID, setCharacteristicUUID] = useState('beb5483e-36e1-4688-b7f5-ea07361b26a8');
  const [deviceName, setDeviceName] = useState('');
  const [devicePrefix, setDevicePrefix] = useState('');
  const [acceptAll, setAcceptAll] = useState(true);
  const [logs, setLogs] = useState(['No logs yet...']);
  const logsRef = useRef(null);

  // Scroll logs automatically
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const log = (msg) => {
    setLogs((prev) => {
      if (prev[0] === 'No logs yet...') return [msg];
      return [...prev, msg];
    });
    console.log(msg);
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

  const handleScanAndConnect = async () => {
    if (!navigator.bluetooth) {
      log("🚫 Web Bluetooth API is not available in this browser.");
      return;
    }

    let filters = [];
    let optionalServices = [];

    let normalizedServiceUUID = normalizeUUID(serviceUUID);
    if (!normalizedServiceUUID) {
      normalizedServiceUUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
      log(`ℹ️ No service UUID provided, using default: ${normalizedServiceUUID}`);
    } else {
      log(`ℹ️ Using service UUID: ${normalizedServiceUUID}`);
    }

    optionalServices.push(normalizedServiceUUID);

    const normalizedCharacteristicUUID = normalizeUUID(characteristicUUID);
    if (!normalizedCharacteristicUUID) {
      log("⚠️ Please provide a writable Characteristic UUID!");
      return;
    } else {
      log(`ℹ️ Using characteristic UUID: ${normalizedCharacteristicUUID}`);
    }

    if (!acceptAll) {
      if (normalizedServiceUUID) filters.push({ services: [normalizedServiceUUID] });
      if (deviceName.trim()) filters.push({ name: deviceName.trim() });
      if (devicePrefix.trim()) filters.push({ namePrefix: devicePrefix.trim() });

      if (filters.length === 0) {
        log("⚠️ No filters set, switching to acceptAllDevices mode");
        filters = null;
      }
    }

    const options = acceptAll || !filters
      ? { acceptAllDevices: true, optionalServices }
      : { filters, optionalServices };

    try {
      log('🔍 Requesting Bluetooth Device...');
      log('Using options: ' + JSON.stringify(options));
      const device = await navigator.bluetooth.requestDevice(options);

      log('✅ Device selected: ' + (device.name || '[Unnamed]'));
      log('🔗 Connecting to GATT Server...');

      const server = await device.gatt.connect();
      log('✅ Connected to GATT Server.');

      log(`🛰 Getting service: ${normalizedServiceUUID}`);
      const service = await server.getPrimaryService(normalizedServiceUUID);

      log(`🔑 Getting characteristic: ${normalizedCharacteristicUUID}`);
      const characteristic = await service.getCharacteristic(normalizedCharacteristicUUID);

      const encoder = new TextEncoder();
      const data = encoder.encode("Hello BLE");

      log(`📤 Writing data to characteristic: "Hello BLE"`);
      await characteristic.writeValue(data);
      log('✅ Data sent successfully!');
    } catch (error) {
      log('❌ Error: ' + error);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <h2>🔍 Bluetooth Device Scanner & Sender</h2>

      <label>Service UUID:</label>
      <input
        value={serviceUUID}
        onChange={(e) => setServiceUUID(e.target.value)}
        placeholder="e.g. 0x180F or full UUID (default: 4fafc201-1fb5-459e-8fcc-c5c9c331914b)"
      />

      <label>Characteristic UUID (Writable):</label>
      <input
        value={characteristicUUID}
        onChange={(e) => setCharacteristicUUID(e.target.value)}
        placeholder="e.g. beb5483e-36e1-4688-b7f5-ea07361b26a8"
      />

      <label>Device Name:</label>
      <input
        value={deviceName}
        onChange={(e) => setDeviceName(e.target.value)}
        placeholder="Exact name (optional)"
      />

      <label>Device Name Prefix:</label>
      <input
        value={devicePrefix}
        onChange={(e) => setDevicePrefix(e.target.value)}
        placeholder="Starts with (optional)"
      />

      <label>
        <input
          type="checkbox"
          checked={acceptAll}
          onChange={(e) => setAcceptAll(e.target.checked)}
        />
        {' '}Accept All Devices
      </label>

      <button onClick={handleScanAndConnect}>Scan, Connect & Send</button>

      <h3>Logs</h3>
      <pre
        ref={logsRef}
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          maxHeight: '300px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap'
        }}
      >
        {logs.join('\n')}
      </pre>
    </div>
  );
}
