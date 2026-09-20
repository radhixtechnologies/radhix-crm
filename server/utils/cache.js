/**
 * Cache Utility
 * Simple in-memory cache (can be replaced with Redis)
 */
class Cache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 3600000; // 1 hour in milliseconds
  }

  /**
   * Get value from cache
   * @param {String} key - Cache key
   * @returns {Object|null}
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set value in cache
   * @param {String} key - Cache key
   * @param {Object} value - Value to cache
   * @param {Number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = null) {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      value,
      expiry,
    });
  }

  /**
   * Delete value from cache
   * @param {String} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Delete all keys matching pattern
   * @param {String} pattern - Pattern to match (simple string match)
   */
  deletePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   * @returns {Object}
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expiry) {
        expired++;
        this.cache.delete(key);
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
    };
  }
}

// Export singleton instance
const cache = new Cache();

module.exports = cache;

