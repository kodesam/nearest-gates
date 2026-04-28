"""
Backend API Tests for Haram Navigator
Tests: GET /api/gates, GET /api/amenities, GET /api/sync/status
"""
import pytest
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env to get EXPO_PUBLIC_BACKEND_URL
frontend_env = Path(__file__).parent.parent.parent / 'frontend' / '.env'
if frontend_env.exists():
    load_dotenv(frontend_env)

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://haram-locator.preview.emergentagent.com').rstrip('/')

class TestGatesAPI:
    """Test GET /api/gates endpoint"""

    def test_gates_endpoint_returns_200(self):
        """Test gates endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/gates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Gates endpoint returns 200")

    def test_gates_returns_25_gates(self):
        """Test gates endpoint returns exactly 25 gates"""
        response = requests.get(f"{BASE_URL}/api/gates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 25, f"Expected 25 gates, got {len(data)}"
        print(f"✓ Gates endpoint returns 25 gates")

    def test_gates_have_required_fields(self):
        """Test each gate has required fields"""
        response = requests.get(f"{BASE_URL}/api/gates")
        assert response.status_code == 200
        gates = response.json()
        
        required_fields = ['id', 'number', 'name_en', 'name_ar', 'latitude', 'longitude', 'side']
        
        for gate in gates:
            for field in required_fields:
                assert field in gate, f"Gate missing field: {field}"
            
            # Validate data types
            assert isinstance(gate['id'], str), "id should be string"
            assert isinstance(gate['number'], int), "number should be int"
            assert isinstance(gate['name_en'], str), "name_en should be string"
            assert isinstance(gate['name_ar'], str), "name_ar should be string"
            assert isinstance(gate['latitude'], (int, float)), "latitude should be numeric"
            assert isinstance(gate['longitude'], (int, float)), "longitude should be numeric"
            assert isinstance(gate['side'], str), "side should be string"
        
        print(f"✓ All gates have required fields with correct types")

    def test_gates_no_mongodb_id(self):
        """Test gates response excludes MongoDB _id field"""
        response = requests.get(f"{BASE_URL}/api/gates")
        assert response.status_code == 200
        gates = response.json()
        
        for gate in gates:
            assert '_id' not in gate, "Gate should not contain MongoDB _id field"
        
        print("✓ Gates response excludes MongoDB _id")

    def test_gates_side_values(self):
        """Test gates have valid side values"""
        response = requests.get(f"{BASE_URL}/api/gates")
        assert response.status_code == 200
        gates = response.json()
        
        valid_sides = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']
        
        for gate in gates:
            assert gate['side'] in valid_sides, f"Invalid side value: {gate['side']}"
        
        print("✓ All gates have valid side values")


class TestAmenitiesAPI:
    """Test GET /api/amenities endpoint"""

    def test_amenities_endpoint_returns_200(self):
        """Test amenities endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/amenities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Amenities endpoint returns 200")

    def test_amenities_returns_20_items(self):
        """Test amenities endpoint returns exactly 20 amenities"""
        response = requests.get(f"{BASE_URL}/api/amenities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 20, f"Expected 20 amenities, got {len(data)}"
        print(f"✓ Amenities endpoint returns 20 amenities")

    def test_amenities_have_required_fields(self):
        """Test each amenity has required fields"""
        response = requests.get(f"{BASE_URL}/api/amenities")
        assert response.status_code == 200
        amenities = response.json()
        
        required_fields = ['id', 'name', 'category', 'latitude', 'longitude', 'description']
        
        for amenity in amenities:
            for field in required_fields:
                assert field in amenity, f"Amenity missing field: {field}"
            
            # Validate data types
            assert isinstance(amenity['id'], str), "id should be string"
            assert isinstance(amenity['name'], str), "name should be string"
            assert isinstance(amenity['category'], str), "category should be string"
            assert isinstance(amenity['latitude'], (int, float)), "latitude should be numeric"
            assert isinstance(amenity['longitude'], (int, float)), "longitude should be numeric"
            assert isinstance(amenity['description'], str), "description should be string"
        
        print(f"✓ All amenities have required fields with correct types")

    def test_amenities_no_mongodb_id(self):
        """Test amenities response excludes MongoDB _id field"""
        response = requests.get(f"{BASE_URL}/api/amenities")
        assert response.status_code == 200
        amenities = response.json()
        
        for amenity in amenities:
            assert '_id' not in amenity, "Amenity should not contain MongoDB _id field"
        
        print("✓ Amenities response excludes MongoDB _id")

    def test_amenities_filter_restaurant(self):
        """Test amenities filter by category=restaurant"""
        response = requests.get(f"{BASE_URL}/api/amenities?category=restaurant")
        assert response.status_code == 200
        amenities = response.json()
        
        assert len(amenities) > 0, "Should return at least one restaurant"
        
        for amenity in amenities:
            assert amenity['category'] == 'restaurant', f"Expected restaurant, got {amenity['category']}"
        
        print(f"✓ Restaurant filter works - returned {len(amenities)} restaurants")

    def test_amenities_filter_grocery(self):
        """Test amenities filter by category=grocery"""
        response = requests.get(f"{BASE_URL}/api/amenities?category=grocery")
        assert response.status_code == 200
        amenities = response.json()
        
        assert len(amenities) > 0, "Should return at least one grocery"
        
        for amenity in amenities:
            assert amenity['category'] == 'grocery', f"Expected grocery, got {amenity['category']}"
        
        print(f"✓ Grocery filter works - returned {len(amenities)} groceries")

    def test_amenities_filter_bus_stop(self):
        """Test amenities filter by category=bus_stop"""
        response = requests.get(f"{BASE_URL}/api/amenities?category=bus_stop")
        assert response.status_code == 200
        amenities = response.json()
        
        assert len(amenities) > 0, "Should return at least one bus_stop"
        
        for amenity in amenities:
            assert amenity['category'] == 'bus_stop', f"Expected bus_stop, got {amenity['category']}"
        
        print(f"✓ Bus stop filter works - returned {len(amenities)} bus stops")

    def test_amenities_filter_taxi_stand(self):
        """Test amenities filter by category=taxi_stand"""
        response = requests.get(f"{BASE_URL}/api/amenities?category=taxi_stand")
        assert response.status_code == 200
        amenities = response.json()
        
        assert len(amenities) > 0, "Should return at least one taxi_stand"
        
        for amenity in amenities:
            assert amenity['category'] == 'taxi_stand', f"Expected taxi_stand, got {amenity['category']}"
        
        print(f"✓ Taxi stand filter works - returned {len(amenities)} taxi stands")

    def test_amenities_filter_meqat(self):
        """Test amenities filter by category=meqat"""
        response = requests.get(f"{BASE_URL}/api/amenities?category=meqat")
        assert response.status_code == 200
        amenities = response.json()
        
        assert len(amenities) > 0, "Should return at least one meqat"
        
        for amenity in amenities:
            assert amenity['category'] == 'meqat', f"Expected meqat, got {amenity['category']}"
        
        print(f"✓ Meqat filter works - returned {len(amenities)} meqats")


class TestSyncStatusAPI:
    """Test GET /api/sync/status endpoint"""

    def test_sync_status_returns_200(self):
        """Test sync status endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/sync/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Sync status endpoint returns 200")

    def test_sync_status_has_required_fields(self):
        """Test sync status has required fields"""
        response = requests.get(f"{BASE_URL}/api/sync/status")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ['last_synced', 'gates_count', 'amenities_count']
        
        for field in required_fields:
            assert field in data, f"Sync status missing field: {field}"
        
        # Validate data types
        assert isinstance(data['last_synced'], str), "last_synced should be string (ISO timestamp)"
        assert isinstance(data['gates_count'], int), "gates_count should be int"
        assert isinstance(data['amenities_count'], int), "amenities_count should be int"
        
        print("✓ Sync status has all required fields with correct types")

    def test_sync_status_counts_match(self):
        """Test sync status counts match actual data"""
        response = requests.get(f"{BASE_URL}/api/sync/status")
        assert response.status_code == 200
        status = response.json()
        
        # Verify counts
        assert status['gates_count'] == 25, f"Expected 25 gates, got {status['gates_count']}"
        assert status['amenities_count'] == 20, f"Expected 20 amenities, got {status['amenities_count']}"
        
        print(f"✓ Sync status counts correct: {status['gates_count']} gates, {status['amenities_count']} amenities")

    def test_sync_status_timestamp_valid(self):
        """Test sync status timestamp is valid ISO format"""
        response = requests.get(f"{BASE_URL}/api/sync/status")
        assert response.status_code == 200
        status = response.json()
        
        # Try to parse ISO timestamp
        from datetime import datetime
        try:
            datetime.fromisoformat(status['last_synced'].replace('Z', '+00:00'))
            print(f"✓ Sync status timestamp is valid ISO format: {status['last_synced']}")
        except ValueError:
            pytest.fail(f"Invalid ISO timestamp: {status['last_synced']}")
