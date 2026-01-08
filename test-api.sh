#!/bin/bash

# Quick API Test Script
API_URL="http://localhost:3000/api"

echo "=========================================="
echo "Testing Auth System API"
echo "=========================================="
echo ""

# Test 1: Register a new user
echo "1. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "first_name": "Test",
    "last_name": "User"
  }')
echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extract access token from registration response
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token // .accessToken // empty')

# Test 2: Login
echo "2. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }')
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token from login response
if [ -z "$ACCESS_TOKEN" ]; then
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // .accessToken // empty')
fi

# Test 3: Get current user profile (protected)
echo "3. Testing Protected Endpoint - Get Current User..."
if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  curl -s -X GET "$API_URL/users/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' 2>/dev/null || echo "Failed to get user profile"
else
  echo "No access token available, skipping protected endpoint test"
fi
echo ""

# Test 4: Health check (if available)
echo "4. Testing API Health..."
curl -s "$API_URL/health" 2>/dev/null || echo "Health endpoint not available"
echo ""

echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
echo ""
echo "Swagger Documentation: http://localhost:3000/api/docs"
echo ""
