// Service worker for background tasks and API communication

class ExchangeRateManager {
  constructor() {
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.KASPA_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd';
    this.BITCOIN_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
    this.pendingRequests = new Map(); // Track pending API requests to prevent duplicates
  }

  async getKaspaRate() {
    return this.getCoinRate('kaspa', this.KASPA_API_URL);
  }

  async getBitcoinRate() {
    return this.getCoinRate('bitcoin', this.BITCOIN_API_URL);
  }

  async getCoinRate(coinId, apiUrl) {
    try {
      // Check if we have cached data first
      const cached = await this.getCachedRate(coinId);
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log(`Using cached ${coinId} rate:`, cached.rate);
        return cached.rate;
      }

      // Check if there's already a pending request for this coin
      if (this.pendingRequests.has(coinId)) {
        console.log(`Waiting for existing ${coinId} request...`);
        return await this.pendingRequests.get(coinId);
      }

      // Create new API request
      const requestPromise = this.fetchCoinRate(coinId, apiUrl);
      this.pendingRequests.set(coinId, requestPromise);
      
      try {
        const rate = await requestPromise;
        return rate;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(coinId);
      }
    } catch (error) {
      console.error(`Error getting ${coinId} rate:`, error);
      
      // Try to return stale cached data if available
      const cached = await this.getCachedRate(coinId);
      if (cached && cached.rate) {
        console.log(`Using stale cached ${coinId} rate due to error:`, cached.rate);
        return cached.rate;
      }
      
      throw error;
    }
  }

  async fetchCoinRate(coinId, apiUrl) {
    try {
      // Fetch fresh data from API
      console.log(`Fetching fresh ${coinId} rate from API...`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data[coinId] || !data[coinId].usd) {
        throw new Error('Invalid API response format');
      }

      const rate = data[coinId].usd;
      
      // Cache the new rate
      await this.cacheRate(coinId, rate);
      
      console.log(`Fresh ${coinId} rate fetched and cached:`, rate);
      return rate;

    } catch (error) {
      console.error(`Error fetching ${coinId} rate:`, error);
      
      // Try to return cached data even if expired
      const cached = await this.getCachedRate(coinId);
      if (cached) {
        console.log(`Using expired cached rate due to API error:`, cached.rate);
        return cached.rate;
      }
      
      throw error;
    }
  }

  async getCachedRate(coinId) {
    try {
      const rateKey = `${coinId}Rate`;
      const timestampKey = `${coinId}RateTimestamp`;
      const result = await chrome.storage.local.get([rateKey, timestampKey]);
      
      if (result[rateKey] && result[timestampKey]) {
        return {
          rate: result[rateKey],
          timestamp: result[timestampKey]
        };
      }
      return null;
    } catch (error) {
      console.error('Error reading cached rate:', error);
      return null;
    }
  }

  async cacheRate(coinId, rate) {
    try {
      const data = {};
      data[`${coinId}Rate`] = rate;
      data[`${coinId}RateTimestamp`] = Date.now();
      
      await chrome.storage.local.set(data);
      console.log(`${coinId} rate cached successfully`);
    } catch (error) {
      console.error('Error caching rate:', error);
    }
  }

  isCacheValid(timestamp) {
    return (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  async clearCache() {
    try {
      await chrome.storage.local.remove([
        'kaspaRate', 'kaspaRateTimestamp', 
        'bitcoinRate', 'bitcoinRateTimestamp'
      ]);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

const exchangeManager = new ExchangeRateManager();

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getKaspaRate') {
    exchangeManager.getKaspaRate()
      .then(rate => {
        sendResponse({ success: true, rate: rate });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getBitcoinRate') {
    exchangeManager.getBitcoinRate()
      .then(rate => {
        sendResponse({ success: true, rate: rate });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'clearCache') {
    exchangeManager.clearCache()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'refreshRate') {
    exchangeManager.clearCache()
      .then(() => exchangeManager.getKaspaRate())
      .then(rate => {
        sendResponse({ success: true, rate: rate });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep message channel open for async response
  }
});

// Initialize by fetching rate on startup
chrome.runtime.onStartup.addListener(() => {
  exchangeManager.getKaspaRate().catch(console.error);
});

chrome.runtime.onInstalled.addListener(() => {
  exchangeManager.getKaspaRate().catch(console.error);
});
