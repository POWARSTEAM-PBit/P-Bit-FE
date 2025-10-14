# P-Bit Device & Group Management API Specification

This document outlines all the API endpoints required for the P-Bit device management and student group system.

## Table of Contents
1. [Device Management Endpoints](#device-management-endpoints)
2. [Group Management Endpoints](#group-management-endpoints)
3. [Data Access Endpoints](#data-access-endpoints)
4. [Database Schema](#database-schema)
5. [Rate Limiting](#rate-limiting)
6. [Error Handling](#error-handling)

---

## Device Management Endpoints

### 1. Register New Device
**POST** `/device/register`

Register a new P-Bit device to the user's account.

**Request Body:**
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "nickname": "My P-Bit"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "device-uuid",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "nickname": "My P-Bit",
    "user_id": "user-uuid",
    "is_active": false,
    "battery_level": 0,
    "last_seen": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Device with this MAC address already exists",
  "error_type": "duplicate_mac"
}
```

**Validation Rules:**
- MAC address must be unique across all users
- Nickname must be unique per user
- MAC address format: `^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`
- Nickname: 2-20 characters

---

### 2. Get User's Devices
**GET** `/device/user-devices`

Get all devices registered to the current user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "device-uuid",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "nickname": "My P-Bit",
      "is_active": true,
      "battery_level": 85,
      "last_seen": "2024-01-01T12:00:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "classrooms": [
        {
          "classroom_id": "classroom-uuid",
          "classroom_name": "Science Class",
          "assignment_type": "group",
          "assignment_id": "group-uuid"
        }
      ]
    }
  ]
}
```

---

### 3. Get Classroom Devices
**GET** `/device/classroom/{classroom_id}/devices`

Get all devices assigned to a specific classroom.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "assignment-uuid",
      "device_id": "device-uuid",
      "classroom_id": "classroom-uuid",
      "assignment_type": "group",
      "assignment_id": "group-uuid",
      "device": {
        "id": "device-uuid",
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "nickname": "My P-Bit",
        "is_active": true,
        "battery_level": 85,
        "last_seen": "2024-01-01T12:00:00Z"
      }
    }
  ]
}
```

---

### 4. Assign Device to Classroom
**POST** `/device/{device_id}/assign`

Assign a device to a classroom with optional student/group assignment.

**Request Body:**
```json
{
  "classroom_id": "classroom-uuid",
  "assignment_type": "group",
  "assignment_id": "group-uuid"
}
```

**Assignment Types:**
- `"unassigned"` - Available to all students in classroom
- `"student"` - Assigned to specific student
- `"group"` - Assigned to specific group

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assignment-uuid",
    "device_id": "device-uuid",
    "classroom_id": "classroom-uuid",
    "assignment_type": "group",
    "assignment_id": "group-uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 5. Unassign Device from Classroom
**DELETE** `/device/{device_id}/unassign`

Remove device assignment from a classroom.

**Request Body:**
```json
{
  "classroom_id": "classroom-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device unassigned successfully"
}
```

---

### 6. Delete Device
**DELETE** `/device/{device_id}`

Delete a device from the user's account (must be unassigned from all classrooms).

**Response:**
```json
{
  "success": true,
  "message": "Device deleted successfully"
}
```

---

### 7. Get Device by MAC Address
**GET** `/device/mac/{mac_address}`

Get device information by MAC address (for direct access).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "device-uuid",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "nickname": "My P-Bit",
    "is_active": true,
    "battery_level": 85,
    "last_seen": "2024-01-01T12:00:00Z"
  }
}
```

---

## Group Management Endpoints

### 8. Create Group
**POST** `/classroom/{classroom_id}/groups`

Create a new group in a classroom.

**Request Body:**
```json
{
  "name": "Angry Cats",
  "icon": "🐱"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "group-uuid",
    "classroom_id": "classroom-uuid",
    "name": "Angry Cats",
    "icon": "🐱",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 9. Get Classroom Groups
**GET** `/classroom/{classroom_id}/groups`

Get all groups in a classroom.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "group-uuid",
      "classroom_id": "classroom-uuid",
      "name": "Angry Cats",
      "icon": "🐱",
      "created_at": "2024-01-01T00:00:00Z",
      "student_count": 3
    }
  ]
}
```

---

### 10. Get Classroom Students
**GET** `/classroom/{classroom_id}/students`

Get all students in a classroom with their group assignments.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "student-uuid",
      "first_name": "John",
      "name": "John Doe",
      "email": "john@example.com",
      "group_id": "group-uuid",
      "group_name": "Angry Cats",
      "joined_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 11. Add Student to Group
**POST** `/classroom/{classroom_id}/groups/{group_id}/students`

Add a student to a group.

**Request Body:**
```json
{
  "student_id": "student-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student_id": "student-uuid",
    "group_id": "group-uuid",
    "assigned_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 12. Remove Student from Group
**DELETE** `/classroom/{classroom_id}/groups/{group_id}/students/{student_id}`

Remove a student from a group.

**Response:**
```json
{
  "success": true,
  "message": "Student removed from group"
}
```

---

### 13. Randomly Distribute Students
**POST** `/classroom/{classroom_id}/groups/random-distribute`

Randomly distribute all students to existing groups.

**Response:**
```json
{
  "success": true,
  "data": {
    "distributed_count": 15,
    "groups_used": 3
  }
}
```

---

### 14. Update Group Name
**PUT** `/classroom/{classroom_id}/groups/{group_id}`

Update a group's name.

**Request Body:**
```json
{
  "name": "Happy Dogs"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "group-uuid",
    "name": "Happy Dogs",
    "icon": "🐱",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 15. Delete Group
**DELETE** `/classroom/{classroom_id}/groups/{group_id}`

Delete a group (unassigns all students).

**Response:**
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

---

## Data Access Endpoints

### 16. Get Device Data
**GET** `/device/{device_id}/data`

Get sensor data for a device.

**Query Parameters:**
- `time_range`: `1h`, `6h`, `24h`, `7d`, `30d` (default: `24h`)

**Response:**
```json
{
  "success": true,
  "data": {
    "device_id": "device-uuid",
    "time_range": "24h",
    "sensor_data": [
      {
        "timestamp": "2024-01-01T12:00:00Z",
        "temperature": 23.5,
        "moisture": 65.2,
        "light": 450.8,
        "sound": 42.1
      }
    ],
    "current_readings": {
      "temperature": 23.5,
      "moisture": 65.2,
      "light": 450.8,
      "sound": 42.1,
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }
}
```

---

### 17. Get Device Data by MAC (Direct Access)
**GET** `/device/mac/{mac_address}/data`

Get sensor data for a device by MAC address (rate limited).

**Query Parameters:**
- `time_range`: `1h`, `6h`, `24h`, `7d`, `30d` (default: `24h`)

**Response:** Same as above

---

## Database Schema

### Devices Table
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    battery_level INTEGER DEFAULT 0,
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, nickname)
);
```

### Device Assignments Table
```sql
CREATE TABLE device_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('unassigned', 'student', 'group')),
    assignment_id UUID, -- student_id or group_id
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(device_id, classroom_id)
);
```

### Groups Table
```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Group Memberships Table
```sql
CREATE TABLE group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL, -- references anonymous_students or users
    student_type VARCHAR(20) NOT NULL CHECK (student_type IN ('registered', 'anonymous')),
    assigned_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(student_id, student_type) -- One group per student
);
```

### Device Data Table
```sql
CREATE TABLE device_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    temperature DECIMAL(5,2),
    moisture DECIMAL(5,2),
    light DECIMAL(8,2),
    sound DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_device_timestamp (device_id, timestamp)
);
```

---

## Rate Limiting

### Direct P-Bit Access
- **Rate Limit**: 1 request per second per IP address
- **Purpose**: Prevent brute force attacks on MAC addresses
- **Implementation**: Use Redis or similar for rate limiting
- **Error Response**:
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please wait before trying again.",
  "error_type": "rate_limit_exceeded",
  "retry_after": 1
}
```

---

## Error Handling

### Common Error Types
- `duplicate_mac` - MAC address already exists
- `duplicate_nickname` - Nickname already exists for user
- `device_not_found` - Device doesn't exist
- `classroom_not_found` - Classroom doesn't exist
- `group_not_found` - Group doesn't exist
- `student_not_found` - Student doesn't exist
- `unauthorized` - User doesn't have permission
- `rate_limit_exceeded` - Too many requests
- `validation_error` - Invalid input data

### Error Response Format
```json
{
  "success": false,
  "message": "Human readable error message",
  "error_type": "error_type_code",
  "details": {
    "field": "Specific field error"
  }
}
```

---

## Device Status Logic

### Active Status
A device is considered **active** if:
- New data was received within the last **2 minutes**

### Battery Level
- Retrieved from the most recent data upload
- Default to 0 if no data available

### Data Refresh
- Frontend should ping for new data every **15 seconds**
- Use WebSocket or polling for real-time updates

---

## Security Considerations

1. **MAC Address Validation**: Ensure proper format validation
2. **User Ownership**: Users can only manage their own devices
3. **Classroom Access**: Teachers can only manage their own classrooms
4. **Rate Limiting**: Implement for direct access endpoints
5. **Input Sanitization**: Sanitize all user inputs
6. **SQL Injection**: Use parameterized queries

---

## Testing Requirements

1. **Unit Tests**: Test all endpoint logic
2. **Integration Tests**: Test database interactions
3. **Rate Limiting Tests**: Verify rate limiting works
4. **Validation Tests**: Test input validation
5. **Permission Tests**: Test access control
6. **Performance Tests**: Test with large datasets

---

This specification provides all the endpoints needed for the P-Bit device management and group system. The backend team should implement these endpoints according to the specifications provided.
