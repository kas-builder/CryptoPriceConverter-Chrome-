// Content script to detect and replace USD prices with KAS equivalents

class PriceConverter {
  constructor() {
    this.kaspaRate = null;
    this.bitcoinRate = null;
    this.selectedCoin = 'kaspa'; // Default to kaspa
    this.processedElements = new WeakSet();
    this.originalTexts = new WeakMap(); // Store original text content
    this.isProcessing = false;
    
    // USD price detection patterns
    this.priceRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/g;
    
    // Initialize
    this.init();
  }

  async init() {
    try {
      // Load selected coin preference
      await this.loadSelectedCoin();
      
      // Get initial rate for selected coin
      await this.updateCoinRate();
      
      // Start processing prices on the page
      this.processPage();
      
      // Set up observer for dynamic content
      this.setupMutationObserver();
      
      console.log('USD to crypto converter initialized');
    } catch (error) {
      console.error('Failed to initialize price converter:', error);
    }
  }

  async loadSelectedCoin() {
    try {
      const result = await chrome.storage.local.get('selectedCoin');
      this.selectedCoin = result.selectedCoin || 'kaspa';
      console.log('Selected coin:', this.selectedCoin);
    } catch (error) {
      console.error('Failed to load selected coin:', error);
      this.selectedCoin = 'kaspa'; // Default fallback
    }
  }

  async updateCoinRate() {
    const action = this.selectedCoin === 'kaspa' ? 'getKaspaRate' : 'getBitcoinRate';
    
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success) {
          if (this.selectedCoin === 'kaspa') {
            this.kaspaRate = response.rate;
            console.log('Kaspa rate updated:', this.kaspaRate);
          } else {
            this.bitcoinRate = response.rate;
            console.log('Bitcoin rate updated:', this.bitcoinRate);
          }
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  convertUsd(usdAmount) {
    if (this.selectedCoin === 'kaspa') {
      if (!this.kaspaRate || this.kaspaRate <= 0) return null;
      return usdAmount / this.kaspaRate;
    } else if (this.selectedCoin === 'bitcoin') {
      if (!this.bitcoinRate || this.bitcoinRate <= 0) return null;
      return usdAmount / this.bitcoinRate;
    }
    return null;
  }

  formatCoinAmount(amount) {
    if (this.selectedCoin === 'kaspa') {
      // Always show full numbers with commas for readability
      if (amount >= 1) {
        return Math.round(amount).toLocaleString();
      } else {
        return amount.toFixed(4);
      }
    } else if (this.selectedCoin === 'bitcoin') {
      // Show sats for small amounts, BTC for large amounts
      if (amount < 0.01) {
        // Convert to satoshis (1 BTC = 100,000,000 sats)
        const sats = Math.round(amount * 100000000);
        return sats.toLocaleString() + ' sats';
      } else {
        return amount.toFixed(8) + ' BTC';
      }
    }
    return amount.toString();
  }





  processTextNode(textNode) {
    if (!textNode.textContent || this.processedElements.has(textNode)) {
      return;
    }

    const originalText = textNode.textContent;
    
    // Skip if already contains crypto conversions
    if (originalText.includes('KAS)') || originalText.includes(' KAS') || 
        originalText.includes('BTC)') || originalText.includes(' BTC') || 
        originalText.includes('sats)') || originalText.includes(' sats')) {
      this.processedElements.add(textNode);
      return;
    }

    let modifiedText = originalText;
    let hasMatches = false;

    modifiedText = originalText.replace(this.priceRegex, (match, amount, offset) => {
      // Clean up the amount (remove commas)
      const numericAmount = parseFloat(amount.replace(/,/g, ''));
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return match;
      }

      // Skip per-unit pricing patterns
      const textAroundPrice = originalText.substring(Math.max(0, offset - 20), offset + match.length + 20).toLowerCase();
      const perUnitPatterns = [
        /per\s*(oz|ounce|lb|pound|gram|kg|kilogram|fl\s*oz|liter|ml|gallon|count|item|piece|unit)/,
        /\(\$[\d.,]+\s*(\/|per)\s*(oz|ounce|lb|pound|gram|kg|fl\s*oz|count|item)\)/,
        /\/\s*(oz|ounce|lb|pound|gram|kg|kilogram|fl\s*oz|liter|ml|gallon|count|item|piece|unit)/,
        /price\s*per/,
        /unit\s*price/
      ];

      if (perUnitPatterns.some(pattern => pattern.test(textAroundPrice))) {
        return match; // Skip per-unit prices
      }

      // Skip very small amounts that are likely per-unit pricing
      if (numericAmount < 0.50) {
        return match;
      }

      const coinAmount = this.convertUsd(numericAmount);
      if (coinAmount === null) {
        return match;
      }

      const formattedAmount = this.formatCoinAmount(coinAmount);
      const coinLabel = this.selectedCoin === 'kaspa' ? 'KAS' : '';
      const color = this.selectedCoin === 'kaspa' ? '#2EAF94' : '#F7931A';
      hasMatches = true;
      
      return `${match} (<span style="color: ${color}; font-weight: bold;">${formattedAmount}${coinLabel ? ' ' + coinLabel : ''}</span>)`;
    });

    if (hasMatches && modifiedText !== originalText) {
      // Store original text before modification
      if (!this.originalTexts.has(textNode)) {
        this.originalTexts.set(textNode, originalText);
      }
      
      // Check if we need to use HTML (contains span tags)
      if (modifiedText.includes('<span')) {
        // Create a temporary element to hold the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modifiedText;
        
        // Replace the text node with the HTML content
        const parentNode = textNode.parentNode;
        if (parentNode) {
          // Insert all child nodes from tempDiv
          const insertedNodes = [];
          while (tempDiv.firstChild) {
            const node = tempDiv.firstChild;
            parentNode.insertBefore(node, textNode);
            insertedNodes.push(node);
          }
          // Remove the original text node
          parentNode.removeChild(textNode);
          
          // Mark inserted nodes as processed to avoid reprocessing
          insertedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
              this.processedElements.add(node);
            }
          });
        }
      } else {
        textNode.textContent = modifiedText;
        this.processedElements.add(textNode);
      }
    }
  }



  processElement(element) {
    // Skip if already processed or if it's a script/style element
    if (this.processedElements.has(element) || 
        ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(element.tagName)) {
      return;
    }

    // Process text nodes directly in this element
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip if parent is script, style, input, or textarea
          const parent = node.parentElement;
          if (parent && ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip if text doesn't contain dollar signs
          if (!node.textContent.includes('$')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => this.processTextNode(textNode));
    this.processedElements.add(element);
  }

  processPage() {
    if (this.isProcessing || (!this.kaspaRate && !this.bitcoinRate)) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process the entire document body
      if (document.body) {
        this.processElement(document.body);
      }
    } catch (error) {
      console.error('Error processing page:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      if (!this.kaspaRate && !this.bitcoinRate) return;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Small delay to allow content to settle
            setTimeout(() => this.processElement(node), 100);
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('$')) {
            setTimeout(() => this.processTextNode(node), 100);
          }
        });
      });
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log('Mutation observer set up for dynamic content');
  }

  async refresh() {
    try {
      await this.loadSelectedCoin();
      await this.updateCoinRate();
      
      // Remove all existing conversions from the page
      this.removeAllConversions();
      
      // Clear processed elements to allow reprocessing
      this.processedElements = new WeakSet();
      this.originalTexts = new WeakMap();
      
      // Reprocess the page with new rate
      this.processPage();
      console.log('Price converter refreshed with new rate');
    } catch (error) {
      console.error('Failed to refresh price converter:', error);
    }
  }

  removeAllConversions() {
    // Find all span elements with crypto conversions and remove them
    const cryptoSpans = document.querySelectorAll('span[style*="color: #2EAF94"], span[style*="color: #F7931A"]');
    cryptoSpans.forEach(span => {
      if (span.textContent.includes('KAS') || span.textContent.includes('BTC') || span.textContent.includes('sats')) {
        // Remove the span and its parentheses
        const parent = span.parentNode;
        if (parent) {
          const textContent = parent.textContent;
          // Remove the crypto conversion part (e.g., " (123 KAS)" or " (5000 sats)")
          const cleanedText = textContent.replace(/\s*\([^)]*(?:KAS|BTC|sats)[^)]*\)/g, '');
          parent.textContent = cleanedText;
        }
      }
    });
    
    // Also clean up any remaining text nodes with crypto conversions
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return (node.textContent.includes('KAS)') || node.textContent.includes('BTC)') || node.textContent.includes('sats)')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    const nodesToClean = [];
    let node;
    while (node = walker.nextNode()) {
      nodesToClean.push(node);
    }
    
    nodesToClean.forEach(textNode => {
      textNode.textContent = textNode.textContent.replace(/\s*\([^)]*(?:KAS|BTC|sats)[^)]*\)/g, '');
    });
  }
}

// Initialize the price converter when the page is ready
let priceConverter;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    priceConverter = new PriceConverter();
  });
} else {
  priceConverter = new PriceConverter();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshContent') {
    if (priceConverter) {
      priceConverter.refresh();
    }
    sendResponse({ success: true });
  }
  
  if (request.action === 'refreshConversion') {
    if (priceConverter) {
      priceConverter.refresh();
    }
    sendResponse({ success: true });
  }
});
