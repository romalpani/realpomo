/**
 * realpomo Website - Release Download Manager
 * Secure, production-ready JavaScript module
 */

(function() {
  'use strict';

  // ============================================================================
  // Configuration
  // ============================================================================

  const CONFIG = {
    REPO_OWNER: 'romalpani',
    REPO_NAME: 'realpomo',
    CACHE_KEY: 'realpomo_latest_release',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    API_ENDPOINT: 'https://api.github.com/repos',
    GITHUB_BASE: 'https://github.com',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  };

  // ============================================================================
  // Security Utilities
  // ============================================================================

  /**
   * Sanitize string to prevent XSS
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.textContent || '';
  }

  /**
   * Validate URL to prevent open redirects
   * @param {string} url - URL to validate
   * @param {string} allowedDomain - Allowed domain (e.g., 'github.com')
   * @returns {boolean} True if URL is valid and safe
   */
  function isValidUrl(url, allowedDomain) {
    if (typeof url !== 'string' || !url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' && urlObj.hostname.endsWith(allowedDomain);
    } catch (e) {
      return false;
    }
  }

  /**
   * Validate GitHub API response structure
   * @param {any} data - Data to validate
   * @returns {boolean} True if data structure is valid
   */
  function isValidReleaseData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.assets)) return false;
    if (typeof data.tag_name !== 'string') return false;
    return true;
  }

  /**
   * Validate asset data
   * @param {any} asset - Asset to validate
   * @returns {boolean} True if asset is valid
   */
  function isValidAsset(asset) {
    if (!asset || typeof asset !== 'object') return false;
    if (typeof asset.name !== 'string') return false;
    if (typeof asset.browser_download_url !== 'string') return false;
    if (!isValidUrl(asset.browser_download_url, 'github.com')) return false;
    return true;
  }

  // ============================================================================
  // Platform Detection
  // ============================================================================

  /**
   * Detect user's platform
   * @returns {string} Platform identifier ('mac' or 'win')
   */
  function detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac') || userAgent.includes('darwin')) return 'mac';
    if (userAgent.includes('win')) return 'win';
    return 'mac'; // Default to macOS
  }

  // ============================================================================
  // Secure Cache Management
  // ============================================================================

  /**
   * Get cached release data with validation
   * @returns {object|null} Cached data or null
   */
  function getCachedRelease() {
    try {
      const cached = localStorage.getItem(CONFIG.CACHE_KEY);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      
      // Validate cache structure
      if (!parsed || typeof parsed !== 'object') {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        return null;
      }
      
      if (!parsed.timestamp || typeof parsed.timestamp !== 'number') {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        return null;
      }
      
      if (!isValidReleaseData(parsed.data)) {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        return null;
      }
      
      return parsed;
    } catch (e) {
      // Invalid JSON or other error - clear cache
      try {
        localStorage.removeItem(CONFIG.CACHE_KEY);
      } catch (clearError) {
        // Ignore clear errors
      }
      return null;
    }
  }

  /**
   * Cache release data securely
   * @param {object} data - Release data to cache
   */
  function cacheRelease(data) {
    if (!isValidReleaseData(data)) {
      console.warn('Invalid release data, not caching');
      return;
    }
    
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      // Quota exceeded or other storage error
      console.warn('Failed to cache release data:', e);
      // Try to clear old cache and retry once
      try {
        localStorage.removeItem(CONFIG.CACHE_KEY);
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cacheData));
      } catch (retryError) {
        // Give up if retry fails
      }
    }
  }

  /**
   * Check if cache is expired
   * @param {object} cached - Cached data object
   * @returns {boolean} True if cache is expired
   */
  function isCacheExpired(cached) {
    if (!cached || typeof cached.timestamp !== 'number') return true;
    return Date.now() - cached.timestamp > CONFIG.CACHE_DURATION;
  }

  // ============================================================================
  // API Communication
  // ============================================================================

  /**
   * Fetch latest release from GitHub API with retry logic
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<object|null>} Release data or null
   */
  async function fetchLatestRelease(retries = CONFIG.MAX_RETRIES) {
    // Check cache first
    const cached = getCachedRelease();
    if (cached && !isCacheExpired(cached)) {
      return cached.data;
    }

    const apiUrl = `${CONFIG.API_ENDPOINT}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/releases/latest`;
    
    // Validate API URL
    if (!isValidUrl(apiUrl, 'github.com')) {
      console.error('Invalid API URL');
      return cached && cached.data ? cached.data : null;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        // Add timeout via AbortController if supported
        signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
      });

      if (!response.ok) {
        // 404 is expected when no releases exist yet
        if (response.status === 404) {
          return null;
        }
        
        // Retry on server errors
        if (response.status >= 500 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
          return fetchLatestRelease(retries - 1);
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response data
      if (!isValidReleaseData(data)) {
        throw new Error('Invalid release data structure');
      }
      
      // Validate all asset URLs
      for (const asset of data.assets) {
        if (!isValidAsset(asset)) {
          console.warn('Invalid asset found, skipping:', asset);
        }
      }
      
      // Cache the validated response
      cacheRelease(data);
      
      return data;
    } catch (error) {
      // Network errors or timeouts - retry if possible
      if (retries > 0 && (error.name === 'TypeError' || error.name === 'AbortError')) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        return fetchLatestRelease(retries - 1);
      }
      
      // Log non-404 errors
      if (error.message && !error.message.includes('404')) {
        console.error('Error fetching release:', error);
      }
      
      // Return cached data even if expired, as fallback
      if (cached && cached.data) {
        return cached.data;
      }
      
      return null;
    }
  }

  // ============================================================================
  // DOM Updates
  // ============================================================================

  /**
   * Update download links based on release data
   * @param {object|null} release - Release data or null
   */
  function updateDownloadLinks(release) {
    const downloadBtn = document.getElementById('download-btn');
    const versionEl = document.getElementById('version');
    
    if (!downloadBtn) {
      console.warn('Download button not found');
      return;
    }

    if (!release) {
      // Error state - keep button functional but show error
      if (versionEl) {
        versionEl.textContent = '';
        versionEl.setAttribute('aria-label', 'Version information unavailable');
      }
      const fallbackUrl = `${CONFIG.GITHUB_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/releases/latest`;
      if (isValidUrl(fallbackUrl, 'github.com')) {
        downloadBtn.href = fallbackUrl;
      }
      downloadBtn.classList.remove('loading');
      return;
    }

    const platform = detectPlatform();
    
    // Find appropriate asset for platform
    let asset = null;
    
    if (platform === 'mac') {
      // Prefer DMG files
      asset = release.assets.find(a => 
        isValidAsset(a) && a.name.endsWith('.dmg')
      );
    } else if (platform === 'win') {
      // Look for Windows installer
      asset = release.assets.find(a => 
        isValidAsset(a) && (
          a.name.endsWith('.exe') || 
          a.name.toLowerCase().includes('installer') ||
          a.name.toLowerCase().includes('setup')
        )
      );
    }

    if (asset && isValidAsset(asset)) {
      downloadBtn.href = asset.browser_download_url;
      downloadBtn.download = sanitizeString(asset.name);
      downloadBtn.classList.remove('loading');
    } else {
      // Fallback: link to releases page
      const fallbackUrl = `${CONFIG.GITHUB_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/releases/latest`;
      if (isValidUrl(fallbackUrl, 'github.com')) {
        downloadBtn.href = fallbackUrl;
      }
      downloadBtn.classList.remove('loading');
    }

    // Update version display with sanitization
    if (versionEl && release.tag_name) {
      const versionText = sanitizeString(release.tag_name);
      versionEl.textContent = ' ' + versionText;
      versionEl.setAttribute('aria-label', 'Version ' + versionText);
    }
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize the release download manager
   */
  async function init() {
    // Show loading state
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.classList.add('loading');
    }

    // Fetch and update
    try {
      const release = await fetchLatestRelease();
      updateDownloadLinks(release);
    } catch (error) {
      console.error('Failed to initialize download manager:', error);
      // Ensure loading state is removed even on error
      if (downloadBtn) {
        downloadBtn.classList.remove('loading');
      }
      // Set fallback link
      const fallbackUrl = `${CONFIG.GITHUB_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/releases/latest`;
      if (isValidUrl(fallbackUrl, 'github.com') && downloadBtn) {
        downloadBtn.href = fallbackUrl;
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready
    init();
  }

})();
