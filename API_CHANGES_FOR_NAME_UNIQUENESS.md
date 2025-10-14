# API Changes Required for Name Uniqueness

## Overview
This document outlines the API changes needed to enforce unique student names per classroom for the persistent anonymous user system.

## Required Changes

### 1. Update `POST /class/find-anonymous-user` Response

**Current Response (User Not Found):**
```json
{
  "success": false,
  "message": "No user found with this name and PIN combination"
}
```

**New Response (User Not Found):**
```json
{
  "success": false,
  "message": "No user found with this name and PIN combination",
  "error_type": "not_found"
}
```

**New Response (Name Exists, Wrong PIN):**
```json
{
  "success": false,
  "message": "A student with this name already exists in this classroom",
  "error_type": "name_exists"
}
```

### 2. Update `POST /class/join-anonymous` Validation

**New Validation Rules:**
- Check if a student with the same `first_name` already exists in the classroom
- If name exists, return error without creating new user
- Only create new user if name is unique in the classroom

**New Error Response (Duplicate Name):**
```json
{
  "success": false,
  "message": "A student with this name already exists in this classroom. Please choose a different name or contact your teacher.",
  "error_type": "duplicate_name"
}
```

### 3. Database Schema Updates

**Add Unique Constraint:**
```sql
-- Add unique constraint on class_id + first_name combination
ALTER TABLE anonymous_students 
ADD CONSTRAINT unique_name_per_classroom 
UNIQUE (class_id, first_name);
```

**Update Index:**
```sql
-- Update existing index to support name uniqueness checks
DROP INDEX IF EXISTS idx_anonymous_students_lookup;
CREATE UNIQUE INDEX idx_anonymous_students_name_unique 
ON anonymous_students(class_id, first_name);
```

### 4. Business Logic Changes

#### Find Anonymous User Logic:
```python
def find_anonymous_user(class_id, first_name, pin_code):
    # First check if user exists with exact name and PIN match
    user = db.query(AnonymousStudent).filter(
        AnonymousStudent.class_id == class_id,
        AnonymousStudent.first_name == first_name,
        AnonymousStudent.pin_code == pin_code
    ).first()
    
    if user:
        # Update last_active timestamp
        user.last_active = datetime.utcnow()
        db.commit()
        return {"success": True, "data": user}
    
    # Check if name exists with different PIN
    name_exists = db.query(AnonymousStudent).filter(
        AnonymousStudent.class_id == class_id,
        AnonymousStudent.first_name == first_name
    ).first()
    
    if name_exists:
        return {
            "success": False, 
            "message": "A student with this name already exists in this classroom",
            "error_type": "name_exists"
        }
    
    return {
        "success": False,
        "message": "No user found with this name and PIN combination",
        "error_type": "not_found"
    }
```

#### Join Anonymous Logic:
```python
def join_anonymous(class_id, first_name, pin_code):
    # Check if name already exists in classroom
    existing_user = db.query(AnonymousStudent).filter(
        AnonymousStudent.class_id == class_id,
        AnonymousStudent.first_name == first_name
    ).first()
    
    if existing_user:
        return {
            "success": False,
            "message": "A student with this name already exists in this classroom. Please choose a different name or contact your teacher.",
            "error_type": "duplicate_name"
        }
    
    # Create new user (existing logic)
    new_user = AnonymousStudent(
        class_id=class_id,
        first_name=first_name,
        pin_code=pin_code,
        joined_at=datetime.utcnow(),
        last_active=datetime.utcnow()
    )
    
    try:
        db.add(new_user)
        db.commit()
        return {"success": True, "data": new_user}
    except IntegrityError:
        db.rollback()
        return {
            "success": False,
            "message": "A student with this name already exists in this classroom",
            "error_type": "duplicate_name"
        }
```

### 5. Error Handling Updates

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors, duplicate name)
- `401`: Unauthorized
- `404`: Not Found (classroom not found)
- `409`: Conflict (duplicate name - use this for name conflicts)
- `500`: Internal Server Error

**Error Response Format:**
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error_type": "error_category",
  "details": {
    "field": "specific_field_error",
    "code": "ERROR_CODE"
  }
}
```

### 6. Frontend Integration Points

**Error Types to Handle:**
- `name_exists`: Name exists but PIN is wrong
- `duplicate_name`: Trying to create user with existing name
- `not_found`: No user found with name/PIN combination

**Frontend Error Handling:**
```javascript
if (result.errorType === 'name_exists') {
  // Show error on name field: "Name exists, use correct PIN"
  // Show error on PIN field: "Please use the correct PIN"
} else if (result.errorType === 'duplicate_name') {
  // Show error on name field: "Name already taken, choose different name"
} else {
  // Show general error message
}
```

### 7. Testing Scenarios

**Test Cases:**
1. **Valid New User**: Unique name + valid PIN → Success
2. **Returning User**: Existing name + correct PIN → Success (returning user)
3. **Wrong PIN**: Existing name + wrong PIN → Error: name_exists
4. **Duplicate Name**: Existing name + new PIN → Error: duplicate_name
5. **Invalid Classroom**: Valid name + PIN + invalid classroom → Error: classroom_not_found
6. **Database Constraint**: Race condition duplicate creation → Error: duplicate_name

**Edge Cases:**
- Case sensitivity: "John" vs "john" (should be case-sensitive)
- Whitespace: " John " vs "John" (should trim whitespace)
- Special characters: Names with spaces, hyphens, etc.
- Unicode characters: International names

### 8. Migration Strategy

**Database Migration:**
```sql
-- Step 1: Clean up any existing duplicates (if any)
WITH duplicates AS (
    SELECT class_id, first_name, MIN(student_id) as keep_id
    FROM anonymous_students
    GROUP BY class_id, first_name
    HAVING COUNT(*) > 1
)
DELETE FROM anonymous_students 
WHERE (class_id, first_name) IN (
    SELECT class_id, first_name FROM duplicates
) 
AND student_id NOT IN (
    SELECT keep_id FROM duplicates
);

-- Step 2: Add unique constraint
ALTER TABLE anonymous_students 
ADD CONSTRAINT unique_name_per_classroom 
UNIQUE (class_id, first_name);
```

**API Versioning:**
- Maintain backward compatibility for existing endpoints
- Add new error types without breaking existing clients
- Consider API versioning if major changes are needed

### 9. Performance Considerations

**Indexing:**
- Ensure `(class_id, first_name)` index exists for fast lookups
- Consider composite index on `(class_id, first_name, pin_code)` for find operations

**Caching:**
- Consider caching classroom student names for quick duplicate checks
- Cache invalidation when students are added/removed

**Rate Limiting:**
- Implement rate limiting on join attempts to prevent abuse
- Consider temporary locks on failed PIN attempts

This specification ensures that student names are unique per classroom while maintaining the persistent login functionality.
