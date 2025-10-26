// src/ble.ts
// Web Bluetooth helper for P-BIT (BLE only).
export type Reading = {
    ts: number;
    temp?: number; hum?: number; ldr?: number; mic?: number; batt?: number;
    air_temp?: number; soil_temp?: number; air_hum?: number; soil_hum?: number;
  };
  
  const NEW_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
  const NEW_CHAR_UUID    = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
  const LEGACY_SERVICE_UUID = 0x181a;
  const LEGACY_CHAR_UUID    = 0x2a6e;
  
let device: BluetoothDevice | null = null;
let server: BluetoothRemoteGATTServer | null = null;
let newChar: BluetoothRemoteGATTCharacteristic | null = null;
let legacyChar: BluetoothRemoteGATTCharacteristic | null = null;

type Handler = (r: Reading) => void;
const handlers = new Set<Handler>();
export const subscribe = (h: Handler) => { handlers.add(h); return () => handlers.delete(h); };
const emit = (r: Reading) => {
  // Add to batch buffer for backend recording
  batchBuffer.push(r);
  
  // Limit buffer size to prevent memory issues
  if (batchBuffer.length > MAX_BATCH_SIZE) {
    batchBuffer = batchBuffer.slice(-MAX_BATCH_SIZE);
  }
  
  // Emit to all handlers
  handlers.forEach(h => h(r));
};

// Batch recording system
let batchBuffer: Reading[] = [];
let batchTimer: number | null = null;
const BATCH_INTERVAL = 10000; // 10 seconds
const MAX_BATCH_SIZE = 50; // Maximum readings per batch

// Start batch recording
const startBatchRecording = () => {
  if (batchTimer) return; // Already recording
  
  batchTimer = window.setInterval(async () => {
    if (batchBuffer.length > 0) {
      try {
        await recordBatchToBackend([...batchBuffer]);
        batchBuffer = []; // Clear buffer after successful recording
      } catch (error) {
        console.error('Failed to record batch to backend:', error);
        // Keep buffer for retry, but limit size
        if (batchBuffer.length > MAX_BATCH_SIZE) {
          batchBuffer = batchBuffer.slice(-MAX_BATCH_SIZE);
        }
      }
    }
  }, BATCH_INTERVAL);
};

// Stop batch recording
const stopBatchRecording = () => {
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
  // Record any remaining data before stopping
  if (batchBuffer.length > 0) {
    recordBatchToBackend([...batchBuffer]).catch(console.error);
    batchBuffer = [];
  }
};

// Record batch to backend
const recordBatchToBackend = async (readings: Reading[]) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No auth token available for batch recording');
    return;
  }

  // Get classroom ID from session storage (set when navigating to classroom)
  const classroomId = sessionStorage.getItem('currentClassroomId');
  if (!classroomId) {
    console.warn('No classroom ID available for batch recording');
    return;
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/'}classroom-device/record-ble-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Device-Name': sessionStorage.getItem('pbit.deviceName') || 'P-BIT',
      'X-Classroom-ID': classroomId
    },
    body: JSON.stringify({
      readings: readings.map(r => ({
        timestamp: new Date(r.ts).toISOString(),
        temperature: r.temp ?? r.air_temp ?? null,
        thermometer: r.soil_temp ?? null, // Only use soil_temp if available, otherwise null
        humidity: r.hum ?? r.air_hum ?? null,
        moisture: r.soil_hum ?? null, // Only use soil_hum if available, otherwise null
        light: r.ldr ?? null,
        sound: r.mic ?? null,
        battery_level: r.batt ?? null
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`Batch recording failed: ${response.status}`);
  }
};
  
  function parse17(buf: DataView): Reading {
    const r: Reading = { ts: Date.now() };
    if (buf.byteLength !== 17 || buf.getUint8(0) !== 0x02) return r;
    for (let i = 0; i < 5; i++) {
      const base = 2 + i * 3;
      const id = buf.getUint8(base);
      const val = buf.getUint16(base + 1, true);
      if (id === 1) r.temp = val / 10;
      else if (id === 2) r.hum = val / 10;
      else if (id === 3) r.ldr = val;
      else if (id === 4) r.mic = val;
      else if (id === 5) r.batt = val;
    }
    return r;
  }
  function parseLegacy(buf: DataView): Reading {
    const txt = new TextDecoder().decode(new Uint8Array(buf.buffer));
    const r: Reading = { ts: Date.now() };
    try {
      const j = JSON.parse(txt);
      if (typeof j.temp === 'number') r.temp = j.temp;
      if (typeof j.hum  === 'number') r.hum  = j.hum;
      if (typeof j.ldr  === 'number') r.ldr  = j.ldr;
      if (typeof j.mic  === 'number') j.mic  = j.mic;
      if (typeof j.batt === 'number') r.batt = j.batt;
      if (typeof j.air_temp  === 'number') r.air_temp  = j.air_temp;
      if (typeof j.soil_temp === 'number') r.soil_temp = j.soil_temp;
      if (typeof j.air_hum   === 'number') r.air_hum   = j.air_hum;
      if (typeof j.soil_hum  === 'number') r.soil_hum  = j.soil_hum;
    } catch {}
    return r;
  }
  
  async function connectInternal(dev: BluetoothDevice, mode: 'filtered'|'compatible') {
    device = dev;
    device.addEventListener('gattserverdisconnected', () => { stop(); });
    server = await dev.gatt!.connect();
    try {
      const svc = await server.getPrimaryService(NEW_SERVICE_UUID);
      newChar = await svc.getCharacteristic(NEW_CHAR_UUID);
      await newChar.startNotifications();
      newChar.addEventListener('characteristicvaluechanged', (e: any) => {
        emit(parse17(e.target.value as DataView));
      });
    } catch {
      if (mode === 'compatible') {
        const svc = await server.getPrimaryService(LEGACY_SERVICE_UUID);
        legacyChar = await svc.getCharacteristic(LEGACY_CHAR_UUID);
        await legacyChar.startNotifications();
        legacyChar.addEventListener('characteristicvaluechanged', (e: any) => {
          emit(parseLegacy(e.target.value as DataView));
        });
      } else {
        throw new Error('P-BIT custom service not found');
      }
    }
  }
  
  export async function connectBLEFiltered() {
    const dev = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'PBIT-' }],
      optionalServices: [NEW_SERVICE_UUID],
    });
    await connectInternal(dev, 'filtered');
    sessionStorage.setItem('pbit.deviceName', dev.name || 'P-BIT');
    // Start recording immediately when device is connected
    startBatchRecording();
    return dev.name || 'P-BIT';
  }
  export async function connectBLECompatible() {
    const dev = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [NEW_SERVICE_UUID, LEGACY_SERVICE_UUID],
    });
    await connectInternal(dev, 'compatible');
    sessionStorage.setItem('pbit.deviceName', dev.name || 'P-BIT');
    // Start recording immediately when device is connected
    startBatchRecording();
    return dev.name || 'P-BIT';
  }
  export function startRecordingAfterDeviceAdded() {
    startBatchRecording(); // Start recording BLE data to backend after device is added to classroom
  }

  export function isRecording() {
    return batchTimer !== null;
  }

  export function stop() {
    stopBatchRecording(); // Stop recording and save any remaining data
    try { newChar?.stopNotifications(); } catch {}
    try { legacyChar?.stopNotifications(); } catch {}
    try { if (server?.connected) server.disconnect(); } catch {}
    device = null; server = null; newChar = null; legacyChar = null;
  }
  export const isConnected = () => !!server?.connected;
