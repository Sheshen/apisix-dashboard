#!/usr/bin/env node
/**
 * Test script to create a sample route that can be duplicated
 */

const axios = require('axios');

const APISIX_ADMIN_URL = 'http://localhost:6174/apisix/admin';
const ADMIN_KEY = 'edd1c9f034335f136f87ad84b625c8f1';

const sampleRoute = {
  name: "sample-route-for-duplicate-test",
  desc: "A sample route to test the duplicate functionality",
  status: 1,
  methods: ["GET", "POST"],
  uri: "/api/test/*",
  upstream: {
    type: "roundrobin",
    nodes: {
      "httpbin.org:443": 1
    },
    scheme: "https"
  },
  labels: {
    environment: "test",
    purpose: "duplicate-demo"
  }
};

async function createSampleRoute() {
  try {
    console.log('Creating sample route for duplicate testing...');
    
    const response = await axios.post(
      `${APISIX_ADMIN_URL}/routes`,
      sampleRoute,
      {
        headers: {
          'X-API-KEY': ADMIN_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Sample route created successfully!');
    console.log('Route ID:', response.data.key);
    console.log('\n🎯 Now you can:');
    console.log('1. Go to http://localhost:5173/ui/routes');
    console.log('2. Find the "sample-route-for-duplicate-test" route');
    console.log('3. Click the blue duplicate button (copy icon)');
    console.log('4. It will open the add route form with pre-filled data');
    console.log('5. Modify the name and save to create a duplicate route');
    
  } catch (error) {
    console.error('❌ Error creating sample route:', error.response?.data || error.message);
  }
}

// Install axios if not available, then run
(async () => {
  try {
    require('axios');
    await createSampleRoute();
  } catch (e) {
    console.log('📦 Installing axios...');
    const { execSync } = require('child_process');
    execSync('npm install axios', { stdio: 'inherit' });
    console.log('✅ Axios installed, creating sample route...');
    await createSampleRoute();
  }
})();
