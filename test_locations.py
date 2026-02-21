#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys
import subprocess
from datetime import datetime

BASE_URL = "http://localhost:3000"

def make_request(method, url, data=None, headers=None):
    """Make HTTP request"""
    if headers is None:
        headers = {}
    headers['Content-Type'] = 'application/json'
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8')), 200
    except urllib.error.HTTPError as e:
        try:
            error_data = json.loads(e.read().decode('utf-8'))
        except:
            error_data = {"error": str(e)}
        return error_data, e.code

def approve_user_in_db(email):
    """Approve user in MongoDB"""
    mongosh_cmd = f"""
    use lpg_db
    db.users.updateOne(
      {{ email: "{email}" }},
      {{ \$set: {{ approvalStatus: "approved" }} }}
    )
    """
    
    try:
        process = subprocess.Popen(['mongosh'], stdin=subprocess.PIPE, 
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        process.communicate(input=mongosh_cmd.encode())
        return True
    except:
        return False

def test_agency_registration():
    print("\n========== TEST 1: Register New Agency ==========")
    
    sapcode = f"TEST_{int(datetime.now().timestamp())}"
    email = f"testlpg_{int(datetime.now().timestamp())}@example.com"
    
    data, code = make_request("POST", f"{BASE_URL}/auth/register", {
        "gasAgencyName": "TestLPG Agency",
        "sapcode": sapcode,
        "email": email,
        "password": "Test@123456",
        "company": "IOCL"
    })
    
    print(json.dumps(data, indent=2))
    
    if code == 200 and data.get("success"):
        print("[PASS] Agency registered successfully")
        
        # Auto-approve for testing
        print("[INFO] Auto-approving agency for testing...")
        approve_user_in_db(email)
        
        return sapcode, email
    else:
        print("[FAIL] Agency registration failed")
        sys.exit(1)

def test_login(sapcode):
    print("\n========== TEST 2: Login and Get Token ==========")
    
    data, code = make_request("POST", f"{BASE_URL}/auth/login", {
        "identifier": f"admin_{sapcode}",
        "password": "Test@123456"
    })
    
    print(json.dumps(data, indent=2))
    
    if code == 200 and data.get("success") and data.get("token"):
        print("[PASS] Login successful. Token obtained.")
        return data.get("token"), data.get("agency", {}).get("_id")
    else:
        print("[FAIL] Login failed")
        sys.exit(1)

def test_default_locations(token):
    print("\n========== TEST 3: Verify Default Locations Created ==========")
    
    headers = {"Authorization": f"Bearer {token}"}
    data, code = make_request("GET", f"{BASE_URL}/inventory/stock-locations", headers=headers)
    
    print(json.dumps(data, indent=2))
    
    total = data.get("pagination", {}).get("total", 0)
    if total == 2:
        print(f"[PASS] Exactly 2 default locations created")
        return True
    else:
        print(f"[FAIL] Expected 2 locations, got {total}")
        return False

def test_vehicle_creation(token):
    print("\n========== TEST 4: Create Vehicle (Auto-Creates Location) ==========")
    
    headers = {"Authorization": f"Bearer {token}"}
    data, code = make_request("POST", f"{BASE_URL}/inventory/vehicle",
        {
            "registrationNumber": "KL-07-AB-2025",
            "vehicleType": "TEMPO",
            "vehicleName": "Delivery Tempo",
            "make": "Tata",
            "model": "ACE"
        },
        headers=headers)
    
    print(json.dumps(data, indent=2))
    
    if code == 201 and data.get("success"):
        vehicle_id = data.get("vehicle", {}).get("_id")
        stock_loc_id = data.get("vehicle", {}).get("stockLocationId")
        if stock_loc_id:
            print(f"[PASS] Vehicle created with stockLocationId: {stock_loc_id}")
            return vehicle_id, stock_loc_id
        else:
            print("[FAIL] Vehicle created but stockLocationId not populated")
            return None, None
    else:
        print("[FAIL] Vehicle creation failed")
        return None, None

def test_vehicle_location_verification(token):
    print("\n========== TEST 5: Verify Vehicle Location Auto-Created ==========")
    
    headers = {"Authorization": f"Bearer {token}"}
    data, code = make_request("GET", f"{BASE_URL}/inventory/stock-locations?type=VEHICLE",
        headers=headers)
    
    print(json.dumps(data, indent=2))
    
    total = data.get("pagination", {}).get("total", 0)
    if total == 1:
        print("[PASS] Vehicle location auto-created")
        return True
    else:
        print(f"[FAIL] Expected 1 vehicle location, got {total}")
        return False

def test_total_locations(token):
    print("\n========== TEST 6: Verify Total Locations = 3 ==========")
    
    headers = {"Authorization": f"Bearer {token}"}
    data, code = make_request("GET", f"{BASE_URL}/inventory/stock-locations",
        headers=headers)
    
    print(json.dumps(data, indent=2))
    
    total = data.get("pagination", {}).get("total", 0)
    if total == 3:
        print(f"[PASS] Total locations = 3 (2 defaults + 1 vehicle)")
        return True
    else:
        print(f"[FAIL] Expected 3 locations, got {total}")
        return False

def main():
    print("=" * 60)
    print("Location-Aware Stock System - Test Suite")
    print("=" * 60)
    
    try:
        # Test 1: Register agency
        sapcode, email = test_agency_registration()
        
        # Test 2: Login
        token, agency_id = test_login(sapcode)
        
        # Test 3: Verify default locations
        test_default_locations(token)
        
        # Test 4: Create vehicle
        vehicle_id, stock_loc_id = test_vehicle_creation(token)
        
        # Test 5: Verify vehicle location
        test_vehicle_location_verification(token)
        
        # Test 6: Verify total locations
        test_total_locations(token)
        
        print("\n" + "=" * 60)
        print("ALL CORE TESTS PASSED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"[FAIL] Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
