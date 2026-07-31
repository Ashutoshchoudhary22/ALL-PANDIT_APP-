const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Only watch Customer-App — ignore sibling apps in the monorepo (saves memory).
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
// Prefer CJS entry points so Metro can resolve socket.io sub-dependencies.
config.resolver.unstable_enablePackageExports = false;
config.maxWorkers = 1;
config.server = { port: 8081 };

const escapedRoot = workspaceRoot.replace(/\\/g, '/');
config.resolver.blockList = [
  new RegExp(`${escapedRoot}/Pandit-App/.*`),
  new RegExp(`${escapedRoot}/SuperAdmin/.*`),
  new RegExp(`${escapedRoot}/Backend/.*`),
];

module.exports = config;
