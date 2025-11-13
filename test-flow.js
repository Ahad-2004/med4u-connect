/**
 * Test flow for med4u_connect
 * This script will:
 * 1. Register a user code for a test patient
 * 2. Exchange that code for an access token
 */

const testUserId = 'test-patient-001';
const testHospitalId = 'hospital-001';
const backendUrl = 'http://localhost:4000';

async function runTest() {
  try {
    console.log('\n========== Med4U Connect Test Flow ==========\n');

    // Step 1: Register a user code
    console.log('📝 Step 1: Registering user code...');
    const registerRes = await fetch(`${backendUrl}/register-user-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId })
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      throw new Error(`Register failed: ${JSON.stringify(registerData)}`);
    }
    const userCode = registerData.code;
    console.log(`✅ User code registered: ${userCode}\n`);

    // Step 2: Exchange code for access token
    console.log('🔄 Step 2: Exchanging code for access token...');
    const exchangeRes = await fetch(`${backendUrl}/exchange-user-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: userCode,
        hospitalId: testHospitalId,
        requestedScope: ['view', 'upload']
      })
    });
    const exchangeData = await exchangeRes.json();
    if (!exchangeRes.ok) {
      throw new Error(`Exchange failed: ${JSON.stringify(exchangeData)}`);
    }
    const accessToken = exchangeData.accessToken;
    console.log(`✅ Access token received`);
    console.log(`   - Token: ${accessToken.substring(0, 20)}...`);
    console.log(`   - Scope: ${exchangeData.scope.join(', ')}\n`);

    // Step 3: Use token to get hospital profile
    console.log('📊 Step 3: Fetching hospital profile with token...');
    const profileRes = await fetch(`${backendUrl}/hospital-get-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ patientId: testUserId })
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      throw new Error(`Profile fetch failed: ${JSON.stringify(profileData)}`);
    }
    console.log(`✅ Profile retrieved`);
    console.log(`   - Medications: ${profileData.medications?.length || 0}`);
    console.log(`   - Conditions: ${profileData.conditions?.length || 0}\n`);

    console.log('✨ All tests passed! Flow is working correctly.\n');
    console.log('📌 Configuration for frontend:');
    console.log(`   - Hospital ID: ${testHospitalId}`);
    console.log(`   - Test Code: ${userCode}`);
    console.log(`   - Test User ID: ${testUserId}\n`);

  } catch (err) {
    console.error('❌ Test failed:', err.message, '\n');
    process.exit(1);
  }
}

console.log('Waiting 2 seconds for backend to initialize...');
setTimeout(runTest, 2000);
