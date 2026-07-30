const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Only watch Customer-App — ignore sibling apps in the monorepo (saves memory).
config.watchFolders = [projectRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

const escapedRoot = workspaceRoot.replace(/\\/g, '/');
config.resolver.blockList = [
  new RegExp(`${escapedRoot}/Pandit-App/.*`),
  new RegExp(`${escapedRoot}/SuperAdmin/.*`),
  new RegExp(`${escapedRoot}/Backend/.*`),
];

module.exports = config;
