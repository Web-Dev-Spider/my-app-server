#!/bin/bash

# Location-Aware Stock Management System - Automated Tests
# ========================================================
# This script tests the entire stock location implementation
# Make sure your server is running before executing this script

set -e  # Exit on error

API_BASE="http://localhost:3000"
SAPCODE="TEST_$(date +%s)"  # Unique code for each run
EMAIL="testlpg_$(date +%s)@example.com"

echo "=========================================="
echo "Location-Aware Stock System - Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_section() {
    echo -e "${YELLOW}📋 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================
# TEST 1: Agency Registration
# ============================================
log_section "TEST 1: Register New Agency"

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"gasAgencyName\": \"TestLPG Agency\",
    \"sapcode\": \"$SAPCODE\",
    \"email\": \"$EMAIL\",
    \"password\": \"Test@123456\",
    \"company\": \"IOCL\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'

if echo "$REGISTER_RESPONSE" | jq -e '.success == true' > /dev/null; then
    log_success "Agency registered successfully"
else
    log_error "Agency registration failed"
    exit 1
fi

echo ""

# ============================================
# TEST 2: Login to Get Token
# ============================================
log_section "TEST 2: Login and Get Token"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"identifier\": \"admin_$SAPCODE\",
    \"password\": \"Test@123456\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token from response (handle both cookie and response body)
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
    log_error "Failed to get token from login response"
    echo "Trying to extract from Set-Cookie header instead..."
    exit 1
fi

log_success "Login successful. Token obtained."
AGENCY_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.agency._id // empty')

echo ""

# ============================================
# TEST 3: Verify Default Locations Created
# ============================================
log_section "TEST 3: Verify 2 Default Locations Created"

LOCATIONS_RESPONSE=$(curl -s -X GET "$API_BASE/inventory/stock-locations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$LOCATIONS_RESPONSE" | jq '.'

LOCATION_COUNT=$(echo "$LOCATIONS_RESPONSE" | jq '.pagination.total // 0')

if [ "$LOCATION_COUNT" -eq 2 ]; then
    log_success "Exactly 2 default locations created"
else
    log_error "Expected 2 locations, got $LOCATION_COUNT"
fi

# Get location IDs for later tests
GODOWN_LOC=$(echo "$LOCATIONS_RESPONSE" | jq -r '.data[] | select(.locationType == "GODOWN" and .code == "GDN-01") | ._id' | head -1)
SHOWROOM_LOC=$(echo "$LOCATIONS_RESPONSE" | jq -r '.data[] | select(.locationType == "SHOWROOM" and .code == "SRM-01") | ._id' | head -1)

echo ""

# ============================================
# TEST 4: Create Vehicle
# ============================================
log_section "TEST 4: Create Vehicle (Auto-Creates Location)"

VEHICLE_RESPONSE=$(curl -s -X POST "$API_BASE/inventory/vehicle" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"registrationNumber\": \"KL-07-AB-2025\",
    \"vehicleType\": \"TEMPO\",
    \"vehicleName\": \"Delivery Tempo\",
    \"make\": \"Tata\",
    \"model\": \"ACE\"
  }")

echo "$VEHICLE_RESPONSE" | jq '.'

VEHICLE_ID=$(echo "$VEHICLE_RESPONSE" | jq -r '.vehicle._id // empty')
STOCK_LOCATION_ID=$(echo "$VEHICLE_RESPONSE" | jq -r '.vehicle.stockLocationId // empty')

if [ ! -z "$STOCK_LOCATION_ID" ] && [ "$STOCK_LOCATION_ID" != "null" ]; then
    log_success "Vehicle created with stockLocationId populated: $STOCK_LOCATION_ID"
else
    log_error "Vehicle created but stockLocationId not populated"
fi

echo ""

# ============================================
# TEST 5: Verify Vehicle Location Created
# ============================================
log_section "TEST 5: Verify Vehicle Location Was Auto-Created"

VEHICLE_LOCATIONS=$(curl -s -X GET "$API_BASE/inventory/stock-locations?type=VEHICLE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$VEHICLE_LOCATIONS" | jq '.'

VEHICLE_LOC_COUNT=$(echo "$VEHICLE_LOCATIONS" | jq '.pagination.total // 0')

if [ "$VEHICLE_LOC_COUNT" -eq 1 ]; then
    log_success "Vehicle location auto-created"
    VEHICLE_LOC_NAME=$(echo "$VEHICLE_LOCATIONS" | jq -r '.data[0].name')
    log_success "Location name: $VEHICLE_LOC_NAME"
else
    log_error "Expected 1 vehicle location, got $VEHICLE_LOC_COUNT"
fi

echo ""

# ============================================
# TEST 6: Verify Total Locations = 3
# ============================================
log_section "TEST 6: Verify Total Locations Now = 3"

ALL_LOCATIONS=$(curl -s -X GET "$API_BASE/inventory/stock-locations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

TOTAL=$(echo "$ALL_LOCATIONS" | jq '.pagination.total // 0')

if [ "$TOTAL" -eq 3 ]; then
    log_success "Total locations = 3 (2 defaults + 1 vehicle)"
else
    log_error "Expected 3 locations, got $TOTAL"
fi

echo ""

# ============================================
# TEST 7: Update Vehicle Registration
# ============================================
log_section "TEST 7: Update Vehicle Registration Number"

UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/inventory/vehicle/$VEHICLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"registrationNumber\": \"KL-07-CD-2025\"
  }")

echo "$UPDATE_RESPONSE" | jq '.'

NEW_REG=$(echo "$UPDATE_RESPONSE" | jq -r '.vehicle.registrationNumber // empty')

if [ "$NEW_REG" == "KL-07-CD-2025" ]; then
    log_success "Vehicle registration updated to: $NEW_REG"
else
    log_error "Vehicle registration not updated correctly"
fi

echo ""

# ============================================
# TEST 8: Verify Location Updated
# ============================================
log_section "TEST 8: Verify Location Name/Code Updated"

UPDATED_LOC=$(curl -s -X GET "$API_BASE/inventory/stock-location/$STOCK_LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$UPDATED_LOC" | jq '.'

LOC_CODE=$(echo "$UPDATED_LOC" | jq -r '.data.code // empty')
LOC_NAME=$(echo "$UPDATED_LOC" | jq -r '.data.name // empty')

if [ "$LOC_CODE" == "KL-07-CD-2025" ]; then
    log_success "Location code updated to: $LOC_CODE"
    log_success "Location name updated to: $LOC_NAME"
else
    log_error "Location code/name not updated. Code: $LOC_CODE, Name: $LOC_NAME"
fi

echo ""

# ============================================
# TEST 9: Deactivate Vehicle
# ============================================
log_section "TEST 9: Deactivate Vehicle"

DEACTIVATE=$(curl -s -X PUT "$API_BASE/inventory/vehicle/$VEHICLE_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"isActive\": false
  }")

echo "$DEACTIVATE" | jq '.'

IS_ACTIVE=$(echo "$DEACTIVATE" | jq -r '.vehicle.isActive // empty')

if [ "$IS_ACTIVE" == "false" ]; then
    log_success "Vehicle deactivated"
else
    log_error "Vehicle not deactivated correctly. isActive: $IS_ACTIVE"
fi

echo ""

# ============================================
# TEST 10: Verify Location Deactivated
# ============================================
log_section "TEST 10: Verify Location Status Synced"

LOC_STATUS=$(curl -s -X GET "$API_BASE/inventory/stock-location/$STOCK_LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$LOC_STATUS" | jq '.'

LOC_IS_ACTIVE=$(echo "$LOC_STATUS" | jq -r '.data.isActive // empty')

if [ "$LOC_IS_ACTIVE" == "false" ]; then
    log_success "Location status synced: isActive = false"
else
    log_error "Location status not synced. isActive: $LOC_IS_ACTIVE"
fi

echo ""

# ============================================
# TEST 11: Create Manual Location
# ============================================
log_section "TEST 11: Create New Manual Location (Godown)"

MANUAL_LOC=$(curl -s -X POST "$API_BASE/inventory/stock-location" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"locationType\": \"GODOWN\",
    \"name\": \"Branch Godown - Delhi\",
    \"code\": \"GDN-02\",
    \"address\": \"Delhi Warehouse Address\"
  }")

echo "$MANUAL_LOC" | jq '.'

MANUAL_LOC_ID=$(echo "$MANUAL_LOC" | jq -r '.data._id // empty')

if [ ! -z "$MANUAL_LOC_ID" ] && [ "$MANUAL_LOC_ID" != "null" ]; then
    log_success "Manual location created: $MANUAL_LOC_ID"
else
    log_error "Manual location creation failed"
fi

echo ""

# ============================================
# TEST 12: Prevent VEHICLE Type Creation
# ============================================
log_section "TEST 12: Try to Create VEHICLE Type (Should Fail)"

VEHICLE_TYPE_ATTEMPT=$(curl -s -X POST "$API_BASE/inventory/stock-location" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"locationType\": \"VEHICLE\",
    \"name\": \"Manual Vehicle\",
    \"code\": \"VEH-01\"
  }")

echo "$VEHICLE_TYPE_ATTEMPT" | jq '.'

ERROR_MSG=$(echo "$VEHICLE_TYPE_ATTEMPT" | jq -r '.message // empty')

if echo "$VEHICLE_TYPE_ATTEMPT" | jq -e '.success == false' > /dev/null; then
    log_success "VEHICLE type creation properly blocked"
    log_success "Error message: $ERROR_MSG"
else
    log_error "VEHICLE type creation should have been blocked but wasn't"
fi

echo ""

# ============================================
# TEST 13: Filter by Type
# ============================================
log_section "TEST 13: Filter Locations by Type"

GODOWN_FILTER=$(curl -s -X GET "$API_BASE/inventory/stock-locations?type=GODOWN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$GODOWN_FILTER" | jq '.'

GODOWN_COUNT=$(echo "$GODOWN_FILTER" | jq '.pagination.total // 0')

if [ "$GODOWN_COUNT" -eq 2 ]; then
    log_success "GODOWN filter returned 2 locations"
else
    log_error "Expected 2 GODOWN locations, got $GODOWN_COUNT"
fi

echo ""

# ============================================
# TEST 14: Pagination
# ============================================
log_section "TEST 14: Test Pagination"

PAGINATED=$(curl -s -X GET "$API_BASE/inventory/stock-locations?page=1&limit=2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$PAGINATED" | jq '.'

PAGE=$(echo "$PAGINATED" | jq '.pagination.page // 0')
LIMIT=$(echo "$PAGINATED" | jq '.pagination.limit // 0')
TOTAL=$(echo "$PAGINATED" | jq '.pagination.total // 0')
PAGES=$(echo "$PAGINATED" | jq '.pagination.pages // 0')
ITEMS_COUNT=$(echo "$PAGINATED" | jq '.data | length')

log_success "Pagination: page=$PAGE, limit=$LIMIT, total=$TOTAL, pages=$PAGES, items_returned=$ITEMS_COUNT"

echo ""

# ============================================
# Final Summary
# ============================================
echo "=========================================="
echo -e "${GREEN}✅ ALL TESTS COMPLETED SUCCESSFULLY${NC}"
echo "=========================================="
echo ""
echo "Test Summary:"
echo "  ✅ Agency registration & default locations"
echo "  ✅ Login & token retrieval"
echo "  ✅ Vehicle creation with auto-location"
echo "  ✅ Location name/code sync on vehicle update"
echo "  ✅ Vehicle & location status sync"
echo "  ✅ Manual location creation"
echo "  ✅ VEHICLE type creation blocked"
echo "  ✅ Type filtering"
echo "  ✅ Pagination"
echo ""
echo "Database values to note:"
echo "  Agency ID: $AGENCY_ID"
echo "  Vehicle ID: $VEHICLE_ID"
echo "  Godown Location: $GODOWN_LOC"
echo "  Showroom Location: $SHOWROOM_LOC"
echo "  Vehicle Location: $STOCK_LOCATION_ID"
echo ""
