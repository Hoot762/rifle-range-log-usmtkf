
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
  ];

// Ensure proper asset resolution
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg');

// Add source extensions
config.resolver.sourceExts.push('ts', 'tsx', 'js', 'jsx', 'json');

// Add polyfills for Node.js modules that csv-stringify needs
config.resolver.alias = {
  ...config.resolver.alias,
  'stream': 'stream-browserify',
  'util': 'util',
  'events': 'events',
  'buffer': '@craftzdog/react-native-buffer',
  'process': 'process',
};

module.exports = config;
