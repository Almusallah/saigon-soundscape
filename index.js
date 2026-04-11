/**
 * SECURITY WARNING:
 * - Never log or expose database credentials or connection strings
 * - Always use environment variables for sensitive information
 * - Database credentials should only be stored in .env file (not in code)
 * - .env files should be in .gitignore to prevent accidental commits
 */

// This is a redirector file for Railway compatibility
// It simply forwards to the actual server entry point
require('./server/index');
