# USD to Kaspa (KAS) Converter Chrome Extension

## Overview

This is a Chrome extension that automatically detects USD prices on web pages and displays their equivalent values in Kaspa (KAS) cryptocurrency. The extension uses the CoinGecko API to fetch live exchange rates and implements smart caching to optimize performance.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 22, 2025)

- Modernized popup UI with minimalistic design
- Removed settings button and panel for cleaner interface
- Implemented elegant toggle switch for Kaspa/Bitcoin selection
- Added dynamic theming with identifying colors (green for Kaspa, orange for Bitcoin)
- Added auto-refresh functionality when switching between cryptocurrencies
- Improved typography, spacing, and visual hierarchy
- Enhanced user experience with smooth transitions and animations

## System Architecture

The extension follows the Chrome Extension Manifest V3 architecture with three main components:

1. **Service Worker** (`service-worker.js`): Handles background tasks and API communication
2. **Content Script** (`content.js`): Injects into web pages to detect and convert USD prices
3. **Popup Interface** (`popup.html/js/css`): Provides user interaction through the browser toolbar

### Technology Stack
- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: JavaScript (ES6+), HTML5, CSS3
- **API Integration**: CoinGecko REST API
- **Storage**: Chrome Storage API
- **Architecture Pattern**: Event-driven with message passing

## Key Components

### 1. Service Worker (Background Script)
- **Purpose**: Manages API calls and data caching
- **Key Features**:
  - Fetches exchange rates from CoinGecko API
  - Implements 5-minute caching strategy
  - Handles API errors with fallback to cached data
  - Manages Chrome runtime messages

### 2. Content Script
- **Purpose**: Detects and converts USD prices on web pages
- **Key Features**:
  - Uses regex pattern matching to find USD prices (`$XX.XX` format)
  - Non-intrusive price conversion (adds alongside original prices)
  - MutationObserver for dynamic content detection
  - WeakSet tracking to avoid duplicate processing

### 3. Popup Interface
- **Purpose**: Provides manual control and status information
- **Key Features**:
  - Displays current exchange rate and last update time
  - Manual refresh functionality
  - Status indicators for connection state
  - Clean, responsive UI design

## Data Flow

1. **Initialization**: Content script loads and requests current KAS rate from service worker
2. **Rate Fetching**: Service worker checks cache, fetches from API if needed
3. **Price Detection**: Content script scans page for USD price patterns
4. **Conversion**: Detected prices are converted using cached exchange rate
5. **Display**: Converted prices appear inline with original USD prices
6. **Updates**: MutationObserver monitors for new content and processes it

## External Dependencies

### APIs
- **CoinGecko API**: Primary data source for USD to KAS exchange rates
  - Endpoint: `https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd`
  - Rate limit: Managed through 5-minute caching
  - Error handling: Fallback to cached data

### Chrome APIs
- **Storage API**: For caching exchange rates
- **Runtime API**: For message passing between components
- **Tabs API**: For content script injection

## Deployment Strategy

### Development Installation
1. Enable Chrome Developer Mode
2. Load unpacked extension from project directory
3. Extension appears with blue "K" icon in toolbar

### Production Deployment
- Package as `.crx` file for Chrome Web Store distribution
- Includes SVG-based icons in multiple sizes (16px, 32px, 48px, 128px)
- Manifest V3 compliance for future Chrome compatibility

### Performance Optimizations
- **Smart Caching**: 5-minute cache duration balances freshness with API efficiency
- **Efficient DOM Processing**: WeakSet prevents duplicate element processing
- **Non-blocking Operations**: Async/await pattern prevents UI blocking
- **Minimal Permissions**: Only requests necessary permissions (storage, activeTab)

### Security Considerations
- Host permissions limited to CoinGecko API domain
- Content script injection at `document_idle` for optimal performance
- Error handling prevents extension crashes from API failures