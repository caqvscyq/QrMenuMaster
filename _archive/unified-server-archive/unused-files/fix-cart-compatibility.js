const axios = require('axios');

async function testCartCompatibility() {
  try {
    console.log('🛒 Testing cart compatibility fixes...');
    
    const sessionId = 'test-session-' + Date.now();
    
    // Test 1: Get empty cart (should return empty array, not 404)
    console.log('\n1. Testing GET cart with session ID in URL...');
    try {
      const response = await axios.get(`http://localhost:5000/api/cart/${sessionId}`);
      console.log('✅ GET cart successful:', response.data);
    } catch (error) {
      console.log('❌ GET cart failed:', error.response?.status, error.response?.data);
    }
    
    // Test 2: Add item to cart using old API format
    console.log('\n2. Testing POST cart with sessionId in body...');
    try {
      const response = await axios.post('http://localhost:5000/api/cart', {
        sessionId: sessionId,
        menuItemId: 1,
        quantity: 2
      });
      console.log('✅ POST cart successful:', response.data);
    } catch (error) {
      console.log('❌ POST cart failed:', error.response?.status, error.response?.data);
    }
    
    // Test 3: Get cart again to see if item was added
    console.log('\n3. Testing GET cart after adding item...');
    try {
      const response = await axios.get(`http://localhost:5000/api/cart/${sessionId}`);
      console.log('✅ GET cart after add successful:', response.data);
    } catch (error) {
      console.log('❌ GET cart after add failed:', error.response?.status, error.response?.data);
    }
    
    // Test 4: Test new API format
    console.log('\n4. Testing new API format with headers...');
    try {
      const response = await axios.get('http://localhost:5000/api/customer/cart', {
        headers: {
          'X-Session-ID': sessionId
        }
      });
      console.log('✅ New API format successful:', response.data);
    } catch (error) {
      console.log('❌ New API format failed:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCartCompatibility();
