# API Routes Specification for Persistent Anonymous Users

## Overview
This document outlines the API routes that need to be implemented on the backend to support the persistent anonymous user system in the frontend.

## Required Routes

### 1. Find Existing Anonymous User
**Route:** `POST /class/find-anonymous-user`

**Purpose:** Check if an anonymous user already exists with the given name and PIN combination.

**Request Body:**
```json
{
  "passphrase": "string",     // Classroom passphrase (8+ characters)
  "first_name": "string",     // Student's first name (max 50 chars)
  "pin_code": "string"        // 4-digit PIN code
}
```

**Response (User Found):**
```json
{
  "success": true,
  "message": "User found",
  "data": {
    "student_id": "string",           // Unique student identifier
    "class_id": "string",             // Classroom ID
    "class_name": "string",           // Classroom name
    "subject": "string",              // Classroom subject
    "first_name": "string",           // Student's first name
    "pin_code": "string",             // Student's PIN code
    "joined_at": "datetime",          // When student first joined
    "last_active": "datetime"         // When student was last active
  }
}
```

**Response (User Not Found):**
```json
{
  "success": false,
  "message": "No user found with this name and PIN combination"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message here"
}
```

---

### 2. Get Anonymous Students for Classroom
**Route:** `GET /class/{classroom_id}/anonymous-students`

**Purpose:** Retrieve all anonymous students who have joined a specific classroom (teachers only).

**Headers:**
```
Authorization: Bearer {teacher_token}
```

**URL Parameters:**
- `classroom_id`: The ID of the classroom

**Response (Success):**
```json
{
  "success": true,
  "message": "Anonymous students retrieved successfully",
  "data": [
    {
      "student_id": "string",
      "first_name": "string",
      "pin_code": "string",
      "joined_at": "datetime",
      "last_active": "datetime"
    },
    {
      "student_id": "string",
      "first_name": "string", 
      "pin_code": "string",
      "joined_at": "datetime",
      "last_active": "datetime"
    }
  ]
}
```

**Response (No Students):**
```json
{
  "success": true,
  "message": "No anonymous students found",
  "data": []
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Unauthorized - Teachers only" // or other error
}
```

---

### 3. Update Student PIN
**Route:** `PUT /class/{classroom_id}/anonymous-student/{student_id}/pin`

**Purpose:** Update the PIN code for a specific anonymous student (teachers only).

**Headers:**
```
Authorization: Bearer {teacher_token}
Content-Type: application/json
```

**URL Parameters:**
- `classroom_id`: The ID of the classroom
- `student_id`: The ID of the anonymous student

**Request Body:**
```json
{
  "pin_code": "string"  // New 4-digit PIN code
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "PIN updated successfully",
  "data": {
    "student_id": "string",
    "new_pin_code": "string"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid PIN format" // or "Student not found" or "Unauthorized"
}
```

---

## Existing Routes (May Need Updates)

### 4. Join Classroom Anonymously (Existing - May Need Updates)
**Route:** `POST /class/join-anonymous`

**Purpose:** Create a new anonymous user and join them to a classroom.

**Request Body:**
```json
{
  "passphrase": "string",     // Classroom passphrase
  "first_name": "string",     // Student's first name
  "pin_code": "string"        // 4-digit PIN code
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully joined classroom",
  "data": {
    "class_id": "string",
    "class_name": "string",
    "subject": "string",
    "student_id": "string",
    "first_name": "string",
    "joined_at": "datetime"
  }
}
```

**Note:** This route should only be called when `/class/find-anonymous-user` returns no existing user.

---

## Database Schema Considerations

### Anonymous Students Table
The backend should maintain a table for anonymous students with the following structure:

```sql
CREATE TABLE anonymous_students (
    student_id VARCHAR(255) PRIMARY KEY,
    class_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    pin_code VARCHAR(4) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique combination of class_id, first_name, and pin_code
    UNIQUE KEY unique_student_per_class (class_id, first_name, pin_code),
    
    -- Foreign key to classrooms table
    FOREIGN KEY (class_id) REFERENCES classrooms(id) ON DELETE CASCADE
);
```

### Indexes for Performance
```sql
-- For fast lookups when finding existing users
CREATE INDEX idx_anonymous_students_lookup ON anonymous_students(class_id, first_name, pin_code);

-- For teacher queries to get all students in a class
CREATE INDEX idx_anonymous_students_class ON anonymous_students(class_id);
```

---

## Business Logic Requirements

### 1. Find Anonymous User Logic
- Search for existing user by `class_id`, `first_name`, and `pin_code`
- If found, update `last_active` timestamp
- Return user data if found, otherwise return not found

### 2. Create Anonymous User Logic
- Only create new user if no existing user found with same name + PIN
- Validate PIN is exactly 4 digits
- Validate first name is not empty and under 50 characters
- Set `joined_at` and `last_active` to current timestamp

### 3. Update PIN Logic
- Verify requesting user is a teacher of the classroom
- Validate new PIN is exactly 4 digits
- Update the PIN and `updated_at` timestamp
- Consider notifying the student (optional)

### 4. Get Anonymous Students Logic
- Verify requesting user is a teacher of the classroom
- Return all anonymous students for the classroom
- Include join date and last activity information

---

## Error Handling

### Common Error Scenarios
1. **Invalid PIN Format**: PIN must be exactly 4 digits
2. **Invalid Name**: First name must be 1-50 characters
3. **Classroom Not Found**: Invalid classroom ID or passphrase
4. **Unauthorized Access**: Non-teacher trying to access teacher-only endpoints
5. **Student Not Found**: Trying to update PIN for non-existent student
6. **Duplicate User**: Attempting to create user that already exists

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (not a teacher)
- `404`: Not Found (classroom/student not found)
- `409`: Conflict (duplicate user)
- `500`: Internal Server Error

---

## Security Considerations

1. **Authentication**: All teacher-only endpoints require valid teacher JWT token
2. **Authorization**: Verify teacher owns the classroom before allowing access
3. **Input Validation**: Validate all input parameters (PIN format, name length, etc.)
4. **Rate Limiting**: Consider rate limiting for anonymous join attempts
5. **Data Privacy**: Ensure anonymous student data is only accessible to classroom teachers

---

## Testing Scenarios

### Test Cases for Backend Implementation
1. **Find Existing User**: Test with valid and invalid name/PIN combinations
2. **Create New User**: Test with valid data and duplicate prevention
3. **Update PIN**: Test with valid teacher and invalid scenarios
4. **Get Students**: Test teacher access and unauthorized access
5. **Edge Cases**: Empty names, invalid PINs, non-existent classrooms

This specification should provide everything needed for the backend team to implement the persistent anonymous user system.
