# Location-Aware Stock Management System - Testing Guide

## Quick Start Test (3 minutes)

### Prerequisites

- Postman or similar API client installed
- Server running: `npm run dev`
- Database connection working

---

## Test 1: Agency Registration Creates Default Locations ✅

**Step 1: Register New Agency**

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "gasAgencyName": "TestLPG Agency",
  "sapcode": "TEST2025",
  "email": "testlpg@example.com",
  "password": "Test@123456",
  "company": "IOCL"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Agency Added and admin created"
}
```

✅ **Success Indicator:** Agency created without errors

---

**Step 2: Login and Get Token**

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "identifier": "admin_TEST2025",
  "password": "Test@123456"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... },
  "agency": { ... }
}
```

✅ **Success Indicator:** Get auth token from response cookies or response body

---

**Step 3: Verify Default Locations Created**

```
GET http://localhost:5000/api/inventory/stock-locations

Headers:
Authorization: Bearer {token}
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "xxx",
      "agencyId": "yyy",
      "locationType": "GODOWN",
      "name": "Main Godown",
      "code": "GDN-01",
      "isActive": true,
      "createdAt": "2025-02-21T..."
    },
    {
      "_id": "zzz",
      "agencyId": "yyy",
      "locationType": "SHOWROOM",
      "name": "Showroom",
      "code": "SRM-01",
      "isActive": true,
      "createdAt": "2025-02-21T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

✅ **Success Indicator:** Exactly 2 locations created with codes GDN-01 and SRM-01

---

## Test 2: Creating Vehicle Auto-Creates Location ✅

**Step 4: Create Vehicle**

```
POST http://localhost:5000/api/inventory/vehicle

Headers:
Authorization: Bearer {token}

Body:
{
  "registrationNumber": "KL-07-AB-2025",
  "vehicleType": "TEMPO",
  "vehicleName": "Delivery Tempo",
  "make": "Tata",
  "model": "ACE"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Vehicle added successfully",
  "vehicle": {
    "_id": "vehicle_id_123",
    "registrationNumber": "KL-07-AB-2025",
    "vehicleName": "Delivery Tempo",
    "stockLocationId": "location_id_456",
    ...
  }
}
```

✅ **Success Indicator:** vehicle has `stockLocationId` populated with a valid ObjectId

---

**Step 5: Verify Vehicle Location Was Created**

```
GET http://localhost:5000/api/inventory/stock-locations?type=VEHICLE

Headers:
Authorization: Bearer {token}
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "location_id_456",
      "agencyId": "yyy",
      "locationType": "VEHICLE",
      "name": "KL-07-AB-2025 Delivery Tempo",
      "code": "KL-07-AB-2025",
      "vehicleId": "vehicle_id_123",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

✅ **Success Indicator:** Vehicle location created with correct name and registration number

---

**Step 6: Verify Total Locations Now = 3**

```
GET http://localhost:5000/api/inventory/stock-locations

Headers:
Authorization: Bearer {token}
```

**Expected:** `"total": 3` in pagination (2 defaults + 1 vehicle)

✅ **Success Indicator:** Total count = 3

---

## Test 3: Update Vehicle Syncs Location ✅

**Step 7: Update Vehicle Registration Number**

```
PUT http://localhost:5000/api/inventory/vehicle/vehicle_id_123

Headers:
Authorization: Bearer {token}

Body:
{
  "registrationNumber": "KL-07-CD-2025"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Vehicle updated successfully",
  "vehicle": {
    "_id": "vehicle_id_123",
    "registrationNumber": "KL-07-CD-2025",
    ...
  }
}
```

✅ **Success Indicator:** Vehicle registration updated

---

**Step 8: Verify Location Updated**

```
GET http://localhost:5000/api/inventory/stock-location/location_id_456

Headers:
Authorization: Bearer {token}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "_id": "location_id_456",
    "name": "KL-07-CD-2025 Delivery Tempo",
    "code": "KL-07-CD-2025",
    ...
  }
}
```

✅ **Success Indicator:** Location name and code updated to match new registration number

---

## Test 4: Deactivate Vehicle Syncs Status ✅

**Step 9: Deactivate Vehicle**

```
PUT http://localhost:5000/api/inventory/vehicle/vehicle_id_123/status

Headers:
Authorization: Bearer {token}

Body:
{
  "isActive": false
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Vehicle deactivated successfully",
  "vehicle": {
    "isActive": false,
    ...
  }
}
```

✅ **Success Indicator:** Vehicle deactivated

---

**Step 10: Verify Location Deactivated Too**

```
GET http://localhost:5000/api/inventory/stock-location/location_id_456

Headers:
Authorization: Bearer {token}
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "isActive": false,
    ...
  }
}
```

✅ **Success Indicator:** Location `isActive: false` matches vehicle status

---

## Test 5: Create Manual Location ✅

**Step 11: Create New Godown Location**

```
POST http://localhost:5000/api/inventory/stock-location

Headers:
Authorization: Bearer {token}

Body:
{
  "locationType": "GODOWN",
  "name": "Branch Godown - Delhi",
  "code": "GDN-02",
  "address": "Delhi Warehouse Address"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Stock location created successfully",
  "data": {
    "_id": "new_location_id",
    "agencyId": "yyy",
    "locationType": "GODOWN",
    "name": "Branch Godown - Delhi",
    "code": "GDN-02",
    "isActive": true
  }
}
```

✅ **Success Indicator:** New location created successfully

---

## Test 6: Prevent VEHICLE Type Manual Creation ✅

**Step 12: Try to Create VEHICLE Type Location (Should Fail)**

```
POST http://localhost:5000/api/inventory/stock-location

Headers:
Authorization: Bearer {token}

Body:
{
  "locationType": "VEHICLE",
  "name": "Manual Vehicle",
  "code": "VEH-01"
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "VEHICLE type locations are auto-created when vehicles are registered. Cannot create manually."
}
```

✅ **Success Indicator:** Returns 400 error preventing manual VEHICLE creation

---

## Test 7: Pagination and Filtering ✅

**Step 13: Get Only Godown Locations**

```
GET http://localhost:5000/api/inventory/stock-locations?type=GODOWN

Headers:
Authorization: Bearer {token}
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    { "locationType": "GODOWN", "name": "Main Godown", ... },
    { "locationType": "GODOWN", "name": "Branch Godown - Delhi", ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  }
}
```

✅ **Success Indicator:** Only GODOWN locations returned, total = 2

---

**Step 14: Test Pagination**

```
GET http://localhost:5000/api/inventory/stock-locations?page=1&limit=2

Headers:
Authorization: Bearer {token}
```

**Expected:**

- Returns 2 items
- Pagination shows `total: 4` (2 defaults + 1 vehicle + 1 branch)
- `page: 1, limit: 2, pages: 2`

✅ **Success Indicator:** Pagination works correctly

---

## MongoDB Verification (Optional)

### Connect to MongoDB

```
mongosh
use your_database_name
```

### Check StockLocation Documents

```javascript
db.stocklocations.find({ agencyId: ObjectId("your_agency_id") }).pretty();
```

**Expected Output:**

```javascript
[
  {
    _id: ObjectId(...),
    agencyId: ObjectId(...),
    locationType: "GODOWN",
    name: "Main Godown",
    code: "GDN-01",
    isActive: true,
    createdAt: ISODate(...)
  },
  {
    _id: ObjectId(...),
    agencyId: ObjectId(...),
    locationType: "SHOWROOM",
    name: "Showroom",
    code: "SRM-01",
    isActive: true,
    createdAt: ISODate(...)
  },
  {
    _id: ObjectId(...),
    agencyId: ObjectId(...),
    locationType: "VEHICLE",
    name: "KL-07-CD-2025 Delivery Tempo",
    code: "KL-07-CD-2025",
    vehicleId: ObjectId(...),
    isActive: false,
    createdAt: ISODate(...)
  },
  {
    _id: ObjectId(...),
    agencyId: ObjectId(...),
    locationType: "GODOWN",
    name: "Branch Godown - Delhi",
    code: "GDN-02",
    isActive: true,
    createdAt: ISODate(...)
  }
]
```

✅ **Success Indicator:** All 4 locations exist with correct structure

### Check Vehicle Document

```javascript
db.vehicles.findOne({ registrationNumber: "KL-07-CD-2025" });
```

**Expected:**

```javascript
{
  _id: ObjectId(...),
  agencyId: ObjectId(...),
  registrationNumber: "KL-07-CD-2025",
  vehicleType: "TEMPO",
  stockLocationId: ObjectId(...),  // ← This should be populated
  isActive: false,
  ...
}
```

✅ **Success Indicator:** Vehicle has `stockLocationId` populated

---

## Final Checklist ✅

| Test                   | Step    | Expected Result                | Status |
| ---------------------- | ------- | ------------------------------ | ------ |
| Agency Registration    | 1-3     | 2 default locations created    | ✅     |
| Create Vehicle         | 4-5     | Vehicle location auto-created  | ✅     |
| Verify Total           | 6       | Total locations = 3            | ✅     |
| Update Registration    | 7-8     | Location name/code updated     | ✅     |
| Deactivate Vehicle     | 9-10    | Location status synced         | ✅     |
| Create Manual Location | 11      | New Godown created             | ✅     |
| Prevent VEHICLE Manual | 12      | 400 error returned             | ✅     |
| Filter by Type         | 13      | Only GODOWN locations returned | ✅     |
| Pagination             | 14      | Pagination works correctly     | ✅     |
| MongoDB Verification   | MongoDB | All documents correct          | ✅     |

---

## Troubleshooting

### Problem: Locations not created after agency registration

**Solution:**

- Check server logs for: `"Warning: Could not create default stock locations"`
- Verify StockLocation model is imported correctly in authController
- Check MongoDB connection is working

### Problem: Vehicle location not created

**Solution:**

- Check server logs for: `"Error creating vehicle stock location"`
- Verify post-save hook is attached to Vehicle schema
- Ensure `this.isNew` check is working (only on new documents)

### Problem: 401/403 errors on requests

**Solution:**

- Verify token is copied correctly from login response
- Add `Authorization: Bearer {token}` header to requests
- Token may have expired - login again

### Problem: Stock location shows old registration number after update

**Solution:**

- Check if updateVehicle is checking for `updates.registrationNumber || updates.vehicleName`
- Make sure StockLocation model exists and is imported
- Check MongoDB to verify location was actually updated

---

## Success Criteria

All tests pass when:

- ✅ 2 default locations auto-created on agency registration
- ✅ 1 vehicle location auto-created when vehicle created
- ✅ Location name = registration number + vehicle name
- ✅ Updating registration updates location name/code
- ✅ Deactivating vehicle deactivates location
- ✅ Filtering by type returns correct locations
- ✅ Pagination works with correct counts
- ✅ Manual VEHICLE creation blocked with 400 error

**If all tests pass, the implementation is working correctly!** 🎉
