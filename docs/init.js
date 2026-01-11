/**
 * realpomo Website - Initialization Script
 * Extracted from inline script for better caching and CSP compliance
 */

(function() {
  'use strict';

  /**
   * Set current year in footer if element exists
   */
  function setCurrentYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  /**
   * Initialize timer when DOM is ready
   */
  function initTimer() {
    var container = document.getElementById('timer-container');
    if (container && typeof window.initTimer === 'function') {
      try {
        window.initTimer(container, {
          maxSeconds: 3600,
          initialSeconds: 0,
          enableSounds: true,
          showPresets: false,
          showDigital: false
        });
      } catch (error) {
        // Silently fail if timer initialization fails
        // Timer is not critical for page functionality
        if (typeof console !== 'undefined' && console.error) {
          console.error('Failed to initialize timer:', error);
        }
      }
    }
  }

  /**
   * Initialize when DOM is ready
   */
  function init() {
    setCurrentYear();
    initTimer();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready
    init();
  }
})();

