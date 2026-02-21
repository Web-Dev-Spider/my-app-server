#!/bin/bash

echo "Setting up test environment..."

# Function to approve user
approve_user() {
    echo "Approving user: $1"
    node /e/Self\ Learning/my-app/server/approve_user.js "$1" > /dev/null 2>&1
    sleep 1
}

# Function to test via curl
test_registration_and_locations() {
    SAPCODE="TEST_$(date +%s)"
    EMAIL="testlpg_$(date +%s)@example.com"
    
    echo ""
    echo "========== TEST 1: Register Agency =========="
    REGISTER=$(curl -s -X POST "http://localhost:3000/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"gasAgencyName\": \"TestLPG Agency\",
            \"sapcode\": \"$SAPCODE\",
            \"email\": \"$EMAIL\",
            \"password\": \"Test@123456\",
            \"company\": \"IOCL\"
        }")
    
    echo "$REGISTER" | python3 -m json.tool 2>/dev/null || echo "$REGISTER"
    
    # Check if registration was successful
    if echo "$REGISTER" | grep -q '"success": true'; then
        echo "[PASS] Agency registered"
        
        # Approve the user
        approve_user "$EMAIL"
        
        echo ""
        echo "========== TEST 2: Login =========="
        LOGIN=$(curl -s -X POST "http://localhost:3000/auth/login" \
            -H "Content-Type: application/json" \
            -d "{
                \"identifier\": \"admin_$SAPCODE\",
                \"password\": \"Test@123456\"
            }")
        
        echo "$LOGIN" | python3 -m json.tool 2>/dev/null || echo "$LOGIN"
        
        # Extract token
        TOKEN=$(echo "$LOGIN" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)
        
        if [ ! -z "$TOKEN" ]; then
            echo "[PASS] Login successful, token: ${TOKEN:0:20}..."
            
            echo ""
            echo "========== TEST 3: Verify Default Locations =========="
            LOCATIONS=$(curl -s -X GET "http://localhost:3000/inventory/stock-locations" \
                -H "Authorization: Bearer $TOKEN")
            
            echo "$LOCATIONS" | python3 -m json.tool 2>/dev/null || echo "$LOCATIONS"
            
            TOTAL=$(echo "$LOCATIONS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pagination', {}).get('total', 0))" 2>/dev/null)
            
            if [ "$TOTAL" == "2" ]; then
                echo "[PASS] Default locations created (total: $TOTAL)"
            else
                echo "[FAIL] Expected 2 locations, got: $TOTAL"
            fi
            
            echo ""
            echo "========== TEST 4: Create Vehicle =========="
            VEHICLE=$(curl -s -X POST "http://localhost:3000/inventory/vehicle" \
                -H "Authorization: Bearer $TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"registrationNumber\": \"KL-07-AB-$(date +%s)\",
                    \"vehicleType\": \"TEMPO\",
                    \"vehicleName\": \"Delivery Tempo\",
                    \"make\": \"Tata\",
                    \"model\": \"ACE\"
                }")
            
            echo "$VEHICLE" | python3 -m json.tool 2>/dev/null || echo "$VEHICLE"
            
            STOCK_LOC=$(echo "$VEHICLE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('vehicle', {}).get('stockLocationId', ''))" 2>/dev/null)
            
            if [ ! -z "$STOCK_LOC" ]; then
                echo "[PASS] Vehicle created with stockLocationId: ${STOCK_LOC:0:20}..."
                
                echo ""
                echo "========== TEST 5: Verify Total Locations = 3 =========="
                TOTAL_LOCATIONS=$(curl -s -X GET "http://localhost:3000/inventory/stock-locations" \
                    -H "Authorization: Bearer $TOKEN")
                
                echo "$TOTAL_LOCATIONS" | python3 -m json.tool 2>/dev/null || echo "$TOTAL_LOCATIONS"
                
                TOTAL=$(echo "$TOTAL_LOCATIONS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('pagination', {}).get('total', 0))" 2>/dev/null)
                
                if [ "$TOTAL" == "3" ]; then
                    echo "[PASS] Total locations = 3 (2 defaults + 1 vehicle)"
                    echo ""
                    echo "=============================================="
                    echo "ALL CORE TESTS PASSED!"
                    echo "=============================================="
                else
                    echo "[FAIL] Expected 3 locations, got: $TOTAL"
                fi
            else
                echo "[FAIL] Vehicle created but no stockLocationId"
            fi
        else
            echo "[FAIL] Login failed - no token received"
        fi
    else
        echo "[FAIL] Agency registration failed"
    fi
}

# Run the test
test_registration_and_locations

