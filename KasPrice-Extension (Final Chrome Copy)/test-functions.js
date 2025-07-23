// Test functions for the cryptocurrency converter extension

// Test 1: Check if service worker is running
async function testServiceWorker() {
  console.log('🧪 Testing Service Worker...');
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getKaspaRate' });
    console.log('✅ Service Worker responded:', response);
    return response.success;
  } catch (error) {
    console.error('❌ Service Worker failed:', error);
    return false;
  }
}

// Test 2: Test Kaspa rate fetching
async function testKaspaRate() {
  console.log('🧪 Testing Kaspa Rate Fetching...');
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getKaspaRate' });
    console.log('✅ Kaspa rate:', response);
    return response.success && response.rate > 0;
  } catch (error) {
    console.error('❌ Kaspa rate failed:', error);
    return false;
  }
}

// Test 3: Test Bitcoin rate fetching
async function testBitcoinRate() {
  console.log('🧪 Testing Bitcoin Rate Fetching...');
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getBitcoinRate' });
    console.log('✅ Bitcoin rate:', response);
    return response.success && response.rate > 0;
  } catch (error) {
    console.error('❌ Bitcoin rate failed:', error);
    return false;
  }
}

// Test 4: Test cache clearing
async function testCacheClear() {
  console.log('🧪 Testing Cache Clear...');
  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearCache' });
    console.log('✅ Cache cleared:', response);
    return response.success;
  } catch (error) {
    console.error('❌ Cache clear failed:', error);
    return false;
  }
}

// Test 5: Test coin selection storage
async function testCoinSelection() {
  console.log('🧪 Testing Coin Selection Storage...');
  try {
    // Test saving Kaspa
    await chrome.storage.local.set({ selectedCoin: 'kaspa' });
    let result = await chrome.storage.local.get('selectedCoin');
    console.log('✅ Kaspa selection saved:', result);
    
    // Test saving Bitcoin
    await chrome.storage.local.set({ selectedCoin: 'bitcoin' });
    result = await chrome.storage.local.get('selectedCoin');
    console.log('✅ Bitcoin selection saved:', result);
    
    return result.selectedCoin === 'bitcoin';
  } catch (error) {
    console.error('❌ Coin selection failed:', error);
    return false;
  }
}

// Test 6: Run all tests
async function runAllTests() {
  console.log('🚀 Starting Extension Tests...');
  console.log('================================');
  
  const results = {
    serviceWorker: await testServiceWorker(),
    kaspaRate: await testKaspaRate(),
    bitcoinRate: await testBitcoinRate(),
    cacheClear: await testCacheClear(),
    coinSelection: await testCoinSelection()
  };
  
  console.log('================================');
  console.log('📊 Test Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return results;
}

// Manual test functions
window.testExtension = {
  runAll: runAllTests,
  serviceWorker: testServiceWorker,
  kaspaRate: testKaspaRate,
  bitcoinRate: testBitcoinRate,
  cacheClear: testCacheClear,
  coinSelection: testCoinSelection
};

console.log('Test functions loaded. Run: testExtension.runAll()');