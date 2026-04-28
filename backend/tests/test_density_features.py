"""
Backend API Tests for Crowd Density Features
Tests: GET /api/gates/density, GET /api/gates/recommend
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


class TestDensityAPI:
    """Test GET /api/gates/density endpoint"""

    def test_density_endpoint_returns_200(self):
        """Test density endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/gates/density")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Density endpoint returns 200")

    def test_density_returns_all_gates(self):
        """Test density endpoint returns data for all 25 gates"""
        response = requests.get(f"{BASE_URL}/api/gates/density")
        assert response.status_code == 200
        data = response.json()
        
        assert 'density' in data, "Response should have 'density' field"
        assert 'timestamp' in data, "Response should have 'timestamp' field"
        
        density_list = data['density']
        assert isinstance(density_list, list), "density should be a list"
        assert len(density_list) == 25, f"Expected 25 gates, got {len(density_list)}"
        print(f"✓ Density endpoint returns data for 25 gates")

    def test_density_has_required_fields(self):
        """Test each density entry has required fields"""
        response = requests.get(f"{BASE_URL}/api/gates/density")
        assert response.status_code == 200
        data = response.json()
        density_list = data['density']
        
        required_fields = ['gate_id', 'gate_number', 'name_en', 'density_percentage', 'density_level', 'updated_at']
        
        for entry in density_list:
            for field in required_fields:
                assert field in entry, f"Density entry missing field: {field}"
            
            # Validate data types
            assert isinstance(entry['gate_id'], str), "gate_id should be string"
            assert isinstance(entry['gate_number'], int), "gate_number should be int"
            assert isinstance(entry['name_en'], str), "name_en should be string"
            assert isinstance(entry['density_percentage'], int), "density_percentage should be int"
            assert isinstance(entry['density_level'], str), "density_level should be string"
            assert isinstance(entry['updated_at'], str), "updated_at should be string"
        
        print(f"✓ All density entries have required fields with correct types")

    def test_density_level_calculations(self):
        """Test density level calculations are correct (low<30%, medium<55%, high<80%, very_high>=80%)"""
        response = requests.get(f"{BASE_URL}/api/gates/density")
        assert response.status_code == 200
        data = response.json()
        density_list = data['density']
        
        for entry in density_list:
            pct = entry['density_percentage']
            level = entry['density_level']
            
            if pct < 30:
                assert level == 'low', f"Gate {entry['gate_id']}: {pct}% should be 'low', got '{level}'"
            elif pct < 55:
                assert level == 'medium', f"Gate {entry['gate_id']}: {pct}% should be 'medium', got '{level}'"
            elif pct < 80:
                assert level == 'high', f"Gate {entry['gate_id']}: {pct}% should be 'high', got '{level}'"
            else:
                assert level == 'very_high', f"Gate {entry['gate_id']}: {pct}% should be 'very_high', got '{level}'"
        
        print("✓ All density level calculations are correct")

    def test_density_percentage_range(self):
        """Test density percentages are within valid range (0-100)"""
        response = requests.get(f"{BASE_URL}/api/gates/density")
        assert response.status_code == 200
        data = response.json()
        density_list = data['density']
        
        for entry in density_list:
            pct = entry['density_percentage']
            assert 0 <= pct <= 100, f"Gate {entry['gate_id']}: density {pct}% out of range (0-100)"
        
        print("✓ All density percentages are within valid range")

    def test_density_valid_levels(self):
        """Test density levels are one of: low, medium, high, very_high"""
        response = requests.get(f"{BASE_URL}/api/gates/density")
        assert response.status_code == 200
        data = response.json()
        density_list = data['density']
        
        valid_levels = ['low', 'medium', 'high', 'very_high']
        
        for entry in density_list:
            level = entry['density_level']
            assert level in valid_levels, f"Gate {entry['gate_id']}: invalid level '{level}'"
        
        print("✓ All density levels are valid")


class TestRecommendationAPI:
    """Test GET /api/gates/recommend endpoint"""

    def test_recommend_endpoint_returns_200(self):
        """Test recommend endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend?lat=21.4220&lng=39.8260")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Recommend endpoint returns 200")

    def test_recommend_has_required_fields(self):
        """Test recommend response has required fields"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend?lat=21.4220&lng=39.8260")
        assert response.status_code == 200
        data = response.json()
        
        assert 'recommended_gate' in data, "Response should have 'recommended_gate' field"
        assert 'all_ranked' in data, "Response should have 'all_ranked' field"
        assert 'timestamp' in data, "Response should have 'timestamp' field"
        
        print("✓ Recommend response has required fields")

    def test_recommend_gate_structure(self):
        """Test recommended gate has correct structure"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend?lat=21.4220&lng=39.8260")
        assert response.status_code == 200
        data = response.json()
        
        gate = data['recommended_gate']
        assert gate is not None, "recommended_gate should not be null"
        
        required_fields = ['id', 'number', 'name_en', 'name_ar', 'latitude', 'longitude', 'side', 
                          'density_percentage', 'density_level', 'distance_m', 'score']
        
        for field in required_fields:
            assert field in gate, f"Recommended gate missing field: {field}"
        
        # Validate data types
        assert isinstance(gate['id'], str), "id should be string"
        assert isinstance(gate['number'], int), "number should be int"
        assert isinstance(gate['name_en'], str), "name_en should be string"
        assert isinstance(gate['name_ar'], str), "name_ar should be string"
        assert isinstance(gate['latitude'], (int, float)), "latitude should be numeric"
        assert isinstance(gate['longitude'], (int, float)), "longitude should be numeric"
        assert isinstance(gate['side'], str), "side should be string"
        assert isinstance(gate['density_percentage'], int), "density_percentage should be int"
        assert isinstance(gate['density_level'], str), "density_level should be string"
        assert isinstance(gate['distance_m'], int), "distance_m should be int"
        assert isinstance(gate['score'], (int, float)), "score should be numeric"
        
        print("✓ Recommended gate has correct structure and types")

    def test_recommend_all_ranked_list(self):
        """Test all_ranked returns top 5 gates"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend?lat=21.4220&lng=39.8260")
        assert response.status_code == 200
        data = response.json()
        
        all_ranked = data['all_ranked']
        assert isinstance(all_ranked, list), "all_ranked should be a list"
        assert len(all_ranked) == 5, f"Expected 5 ranked gates, got {len(all_ranked)}"
        
        print("✓ all_ranked returns top 5 gates")

    def test_recommend_without_location(self):
        """Test recommend endpoint works without location parameters"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert 'recommended_gate' in data, "Response should have 'recommended_gate' field"
        gate = data['recommended_gate']
        assert gate is not None, "Should return a gate even without location"
        
        # Without location, distance should be 0
        assert gate['distance_m'] == 0, "Distance should be 0 when no location provided"
        
        print("✓ Recommend endpoint works without location parameters")

    def test_recommend_density_included(self):
        """Test recommended gate includes density information"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend?lat=21.4220&lng=39.8260")
        assert response.status_code == 200
        data = response.json()
        
        gate = data['recommended_gate']
        
        # Verify density info is present
        assert 'density_percentage' in gate, "Gate should have density_percentage"
        assert 'density_level' in gate, "Gate should have density_level"
        
        # Verify density level is valid
        valid_levels = ['low', 'medium', 'high', 'very_high']
        assert gate['density_level'] in valid_levels, f"Invalid density level: {gate['density_level']}"
        
        # Verify density percentage is in range
        assert 0 <= gate['density_percentage'] <= 100, f"Density {gate['density_percentage']}% out of range"
        
        print(f"✓ Recommended gate includes density: {gate['density_level']} ({gate['density_percentage']}%)")

    def test_recommend_distance_calculated(self):
        """Test distance is calculated when location provided"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend?lat=21.4220&lng=39.8260")
        assert response.status_code == 200
        data = response.json()
        
        gate = data['recommended_gate']
        
        # Distance should be calculated (non-zero for most gates)
        assert 'distance_m' in gate, "Gate should have distance_m"
        assert isinstance(gate['distance_m'], int), "distance_m should be int"
        assert gate['distance_m'] >= 0, "distance_m should be non-negative"
        
        print(f"✓ Distance calculated: {gate['distance_m']}m to {gate['name_en']}")

    def test_recommend_score_calculated(self):
        """Test recommendation score is calculated"""
        response = requests.get(f"{BASE_URL}/api/gates/recommend?lat=21.4220&lng=39.8260")
        assert response.status_code == 200
        data = response.json()
        
        gate = data['recommended_gate']
        
        # Score should be present
        assert 'score' in gate, "Gate should have score"
        assert isinstance(gate['score'], (int, float)), "score should be numeric"
        assert gate['score'] >= 0, "score should be non-negative"
        
        print(f"✓ Recommendation score calculated: {gate['score']}")
