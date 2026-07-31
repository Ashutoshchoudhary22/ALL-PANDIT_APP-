const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Only watch SuperAdmin — ignore sibling apps in the monorepo (saves memory).
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.maxWorkers = 1;
config.server = { port: 8083 };

const escapedRoot = workspaceRoot.replace(/\\/g, '/');
config.resolver.blockList = [
  new RegExp(`${escapedRoot}/Customer-App/.*`),
  new RegExp(`${escapedRoot}/Pandit-App/.*`),
  new RegExp(`${escapedRoot}/Backend/.*`),
];

module.exports = config;
