#!/usr/bin/env node

/**
 * Setup CLI for Design Token System
 * PRD 0057: Onboarding Automation & Impact Analysis
 * 
 * This script automates the initial project setup:
 * - Checks Node.js and NPM versions
 * - Creates .env file from .env.example
 * - Runs initial build
 * - Optionally checks Supabase connection
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, total, message) {
  log(`\n[${step}/${total}] ${message}`, colors.cyan + colors.bright);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Check Node.js version
function checkNodeVersion() {
  logStep(1, 5, 'Checking Node.js version...');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    logError(`Node.js ${nodeVersion} detected. Version 18+ is required.`);
    process.exit(1);
  }
  
  logSuccess(`Node.js ${nodeVersion} ✓`);
}

// Check NPM version
function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    logSuccess(`NPM ${npmVersion} ✓`);
  } catch (err) {
    logError('NPM not found. Please install Node.js with NPM.');
    process.exit(1);
  }
}

// Create .env file
async function setupEnvFile() {
  logStep(2, 5, 'Setting up environment variables...');
  
  if (existsSync('.env')) {
    const overwrite = await question('⚠ .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      logWarning('Skipping .env creation');
      return;
    }
  }
  
  let envContent = '';
  
  if (existsSync('.env.example')) {
    envContent = readFileSync('.env.example', 'utf-8');
    logSuccess('Loaded .env.example template');
  }
  
  log('\nSupabase Configuration (optional - press Enter to skip):', colors.bright);
  
  const supabaseUrl = await question('  Supabase URL: ');
  const supabaseAnonKey = await question('  Supabase Anon Key: ');
  const supabaseServiceKey = await question('  Supabase Service Key (optional): ');
  
  // Update or add values
  if (supabaseUrl) {
    envContent = updateEnvValue(envContent, 'VITE_SUPABASE_URL', supabaseUrl);
  }
  if (supabaseAnonKey) {
    envContent = updateEnvValue(envContent, 'VITE_SUPABASE_ANON_KEY', supabaseAnonKey);
  }
  if (supabaseServiceKey) {
    envContent = updateEnvValue(envContent, 'SUPABASE_SERVICE_KEY', supabaseServiceKey);
  }
  
  writeFileSync('.env', envContent);
  logSuccess('.env file created');
}

function updateEnvValue(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

// Install dependencies
function installDependencies() {
  logStep(3, 5, 'Installing dependencies...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('Dependencies installed');
  } catch (err) {
    logError('Failed to install dependencies');
    process.exit(1);
  }
}

// Run initial build
function runInitialBuild() {
  logStep(4, 5, 'Running initial build...');
  
  log('This may take a minute...', colors.yellow);
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Initial build completed');
  } catch (err) {
    logWarning('Build failed - you may need to configure Supabase first');
  }
}

// Verify setup
async function verifySetup() {
  logStep(5, 5, 'Verifying setup...');
  
  const checks = [
    { name: '.env file', exists: existsSync('.env') },
    { name: 'node_modules', exists: existsSync('node_modules') },
    { name: 'dist directory', exists: existsSync('dist') },
  ];
  
  checks.forEach(check => {
    if (check.exists) {
      logSuccess(check.name);
    } else {
      logWarning(`${check.name} not found`);
    }
  });
}

// Main setup flow
async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║  Design Token System - Setup Wizard                       ║', colors.cyan);
  log('║  PRD 0057: Onboarding Automation                          ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  try {
    checkNodeVersion();
    checkNpmVersion();
    await setupEnvFile();
    installDependencies();
    runInitialBuild();
    await verifySetup();
    
    log('\n╔════════════════════════════════════════════════════════════╗', colors.green);
    log('║  ✓ Setup Complete!                                        ║', colors.green);
    log('╚════════════════════════════════════════════════════════════╝\n', colors.green);
    
    log('\nNext Steps:', colors.bright);
    log('  1. Configure Supabase tables (if using multi-project features)');
    log('  2. Run: npm run dev');
    log('  3. Visit: http://localhost:5173/design-tokens/');
    log('');
    
  } catch (err) {
    logError(`\nSetup failed: ${err.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
