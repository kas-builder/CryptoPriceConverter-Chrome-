# USD to Kaspa (KAS) Converter Chrome Extension by BRT 🔥

A Chrome extension that automatically converts USD prices on any webpage to Kaspa (KAS) equivalents using live exchange rates from CoinGecko.

suppport my work - kaspa:qzu84tx3z5gaawr2rjxx6v6d204j6ltjqegdw7plempc99apfmhey38mlmhhc

## Features

- 🔄 **Automatic Conversion**: Detects and converts USD prices ($XX.XX format) on any webpage
- 📈 **Live Exchange Rates**: Fetches current USD to KAS rates from CoinGecko API
- ⚡ **Smart Caching**: Caches exchange rates for 5 minutes to minimize API calls
- 🎯 **Non-intrusive**: Adds KAS equivalents alongside original USD prices
- 🔄 **Manual Refresh**: Popup interface with "Refresh Rate" button
- 🚀 **Performance Optimized**: Efficient price detection and processing

## Installation Instructions

### Loading the Extension in Chrome

1. **Enable Developer Mode**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" ON in the top-right corner

2. **Load the Extension**:
   - Click "Load unpacked" button
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

3. **Verify Installation**:
   - Look for the green "K" icon in your browser toolbar
   - The extension should be active and ready to use

### Alternative Installation via CRX (if packaged)

1. Download the `.crx` file
2. Drag and drop it onto the `chrome://extensions/` page
3. Click "Add Extension" when prompted

## How to Use

### Automatic Conversion
1. Visit any webpage containing USD prices (e.g., Amazon, eBay, online stores)
2. The extension automatically detects prices in formats like:
   - $19.99
   - $1,234.56
   - $ 99.00
3. Converted prices appear as: `$19.99 (~1,234.5 KAS)`

### Manual Rate Refresh
1. Click the blue "K" icon in your browser toolbar
2. View the current USD to KAS exchange rate
3. Click "Refresh Rate" to force update the exchange rate
4. The new rate will be applied to all open pages

## Testing the Extension

### Test Pages
Try the extension on these types of pages:

1. **E-commerce Sites**:
   - Amazon.com
   - eBay.com
   - Any online store with USD prices

2. **News & Finance Sites**:
   - Financial news articles mentioning dollar amounts
   - Cryptocurrency news sites

3. **Create a Test Page**:
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <h1>Test USD Prices</h1>
     <p>Product A: $29.99</p>
     <p>Product B: $1,234.56</p>
     <p>Service C: $ 99.00</p>
   </body>
   </html>
   ```
   Save this as `test.html` and open in Chrome to verify the extension works.

### Expected Results
- Original prices should remain unchanged
- KAS equivalents should appear in parentheses next to USD amounts
- Popup should show current exchange rate and last update time

## Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Handles API calls and data caching
- **Content Script**: Scans and modifies webpage content
- **Popup Interface**: Manual controls and rate display

### API Integration
- **Data Source**: CoinGecko API (`https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd`)
- **Rate Limiting**: 5-minute cache to respect API limits
- **Error Handling**: Graceful fallback to cached rates if API fails

### Price Detection
- **Regex Pattern**: `/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)/g`
- **Supported Formats**:
  - $19.99
  - $1,234.56
  - $ 99 (with spaces)
  - $1,000,000.00 (large amounts with commas)

## Safari Conversion Compatibility

The extension is designed with Safari Web Extension conversion in mind:

- **Vanilla JavaScript**: No framework dependencies
- **Standard APIs**: Uses cross-browser compatible APIs where possible
- **Clean Architecture**: Modular code structure for easy porting
- **Minimal Dependencies**: No external libraries required

### Safari Conversion Notes
- Manifest format will need adjustment for Safari
- Some Chrome-specific APIs may need Safari equivalents
- Background script might need conversion to background page format

## File Structure

