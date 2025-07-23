// Popup script for USD to KAS Converter

class PopupController {
  constructor() {
    this.elements = {
      currentRate: document.getElementById('currentRate'),
      lastUpdated: document.getElementById('lastUpdated'),
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      refreshButton: document.getElementById('refreshButton'),
      cryptoToggle: document.getElementById('cryptoToggle'),
      headerTitle: document.getElementById('headerTitle')
    };

    this.refreshInProgress = false; // Prevent multiple simultaneous refreshes
    this.lastRefreshTime = 0; // Debounce rapid clicks
    this.minRefreshInterval = 1000; // Minimum 1 second between refreshes
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadSelectedCoin();
    this.loadCurrentRate();
  }

  setupEventListeners() {
    this.elements.refreshButton.addEventListener('click', () => {
      this.refreshRate();
    });

    // Modern crypto toggle switch
    this.elements.cryptoToggle.addEventListener('change', () => {
      const selectedCoin = this.elements.cryptoToggle.checked ? 'bitcoin' : 'kaspa';
      this.saveCoinSelection(selectedCoin);
    });
  }

  async loadCurrentRate() {
    try {
      this.updateStatus('loading', 'Checking rate...');
      
      // Get selected coin from storage
      const result = await chrome.storage.local.get('selectedCoin');
      const selectedCoin = result.selectedCoin || 'kaspa';
      
      const action = selectedCoin === 'kaspa' ? 'getKaspaRate' : 'getBitcoinRate';
      const response = await this.sendMessage({ action });
      
      if (response.success) {
        this.displayRate(response.rate);
        this.updateStatus('success', 'Connected');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to load current rate:', error);
      this.displayError('Failed to load rate');
      this.updateStatus('error', 'Connection failed');
    }
  }

  async refreshRate() {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - this.lastRefreshTime < this.minRefreshInterval) {
      console.log('Refresh rate limited - too frequent clicks');
      return;
    }
    
    // Prevent multiple simultaneous refreshes
    if (this.refreshInProgress) {
      console.log('Refresh already in progress - ignoring click');
      return;
    }
    
    this.refreshInProgress = true;
    this.lastRefreshTime = now;
    
    try {
      this.elements.refreshButton.disabled = true;
      this.elements.refreshButton.classList.add('loading');
      this.updateStatus('loading', 'Refreshing...');

      // Get selected coin and refresh the appropriate rate
      const result = await chrome.storage.local.get('selectedCoin');
      const selectedCoin = result.selectedCoin || 'kaspa';
      
      // Force refresh by clearing cache first
      await this.sendMessage({ action: 'clearCache' });
      
      // Small delay to ensure cache is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get fresh rate for selected coin
      const action = selectedCoin === 'kaspa' ? 'getKaspaRate' : 'getBitcoinRate';
      const response = await this.sendMessage({ action });
      
      if (response.success) {
        this.displayRate(response.rate);
        this.updateStatus('success', 'Rate refreshed');
        
        // Notify content scripts to refresh
        this.notifyContentScripts();
        
        // Reset button state after a short delay
        setTimeout(() => {
          this.updateStatus('success', 'Connected');
        }, 2000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Failed to refresh rate:', error);
      this.updateStatus('error', 'Refresh failed');
    } finally {
      this.refreshInProgress = false;
      this.elements.refreshButton.disabled = false;
      this.elements.refreshButton.classList.remove('loading');
    }
  }

  async displayRate(rate) {
    if (!rate || rate <= 0) {
      this.displayError('Invalid rate');
      return;
    }

    // Get selected coin for formatting
    const result = await chrome.storage.local.get('selectedCoin');
    const selectedCoin = result.selectedCoin || 'kaspa';

    // Format the rate nicely based on selected coin
    const decimals = selectedCoin === 'bitcoin' ? 2 : 4;
    const formattedRate = parseFloat(rate).toFixed(decimals);
    this.elements.currentRate.textContent = `$${formattedRate}`;
    this.elements.lastUpdated.textContent = this.formatTimestamp(Date.now());
  }

  displayError(message) {
    this.elements.currentRate.textContent = 'Error';
    this.elements.lastUpdated.textContent = message;
  }

  updateStatus(type, message) {
    // Remove existing status classes
    this.elements.statusIndicator.classList.remove('loading', 'error');
    
    // Add new status class
    if (type === 'loading') {
      this.elements.statusIndicator.classList.add('loading');
    } else if (type === 'error') {
      this.elements.statusIndicator.classList.add('error');
    }

    this.elements.statusText.textContent = message;
  }

  formatTimestamp(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  async notifyContentScripts() {
    try {
      // Get the active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tabs.length > 0) {
        // Send refresh message to content script
        chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshConversion' }, (response) => {
          if (chrome.runtime.lastError) {
            // Ignore errors - content script might not be loaded
            console.log('Content script not available on this page');
          }
        });
      }
    } catch (error) {
      console.log('Failed to notify content scripts:', error);
    }
  }

  async loadSelectedCoin() {
    try {
      const result = await chrome.storage.local.get('selectedCoin');
      const selectedCoin = result.selectedCoin || 'kaspa'; // Default to kaspa
      
      // Update toggle switch
      this.elements.cryptoToggle.checked = selectedCoin === 'bitcoin';
      
      // Apply theme based on selected coin
      this.applyTheme(selectedCoin);
      this.updateHeaderTitle(selectedCoin);
    } catch (error) {
      console.error('Failed to load selected coin:', error);
      // Default to kaspa on error
      this.elements.cryptoToggle.checked = false;
      this.applyTheme('kaspa');
      this.updateHeaderTitle('kaspa');
    }
  }

  async saveCoinSelection(coin) {
    try {
      await chrome.storage.local.set({ selectedCoin: coin });
      console.log(`Coin selection saved: ${coin}`);
      
      // Apply theme immediately
      this.applyTheme(coin);
      this.updateHeaderTitle(coin);
      
      // Auto-refresh the rate for the new coin
      await this.refreshRate();
      
      // Notify content scripts about the coin change
      this.notifyContentScripts();
      
    } catch (error) {
      console.error('Failed to save coin selection:', error);
    }
  }

  updateHeaderTitle(coin) {
    const title = coin === 'kaspa' ? 'USD to Kaspa' : 'USD to Bitcoin';
    this.elements.headerTitle.textContent = title;
  }

  applyTheme(coin) {
    const body = document.body;
    const switchElement = document.querySelector('.switch');
    
    if (coin === 'bitcoin') {
      // Apply Bitcoin theme
      body.classList.add('bitcoin-theme');
      if (switchElement) switchElement.classList.add('bitcoin-mode');
    } else {
      // Apply Kaspa theme (default)
      body.classList.remove('bitcoin-theme');
      if (switchElement) switchElement.classList.remove('bitcoin-mode');
    }
  }


}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
