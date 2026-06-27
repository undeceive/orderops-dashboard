/**
 * backend/config/env.js
 *
 * Central place for backend environment configuration.
 * This keeps app settings organized and easier to change later.
 */

// Use the hosting provider's PORT if it exists.
// Otherwise, default to port 5000 for local development.
const PORT = process.env.PORT || 5000;

// Export config values so other backend files can use them.
module.exports = {
  PORT,
};
