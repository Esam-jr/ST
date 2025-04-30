#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to .env file
const envPath = path.join(process.cwd(), '.env');

// Function to read existing env file
function readEnvFile() {
  try {
    if (fs.existsSync(envPath)) {
      return fs.readFileSync(envPath, 'utf8');
    }
    return '';
  } catch (error) {
    console.error('Error reading .env file:', error);
    return '';
  }
}

// Function to update env file
function updateEnvFile(content) {
  try {
    fs.writeFileSync(envPath, content);
    console.log('✅ .env file updated successfully!');
  } catch (error) {
    console.error('Error writing .env file:', error);
  }
}

// Function to add or update an environment variable
function addOrUpdateEnvVar(content, key, value) {
  const envVars = content.split('\n');
  const existingVarIndex = envVars.findIndex(line => line.startsWith(`${key}=`));
  
  if (existingVarIndex !== -1) {
    envVars[existingVarIndex] = `${key}=${value}`;
  } else {
    envVars.push(`${key}=${value}`);
  }
  
  return envVars.filter(Boolean).join('\n');
}

console.log('🚀 Pipedream Setup Helper');
console.log('-------------------------');
console.log('This script will help you configure the Pipedream webhook URL for event announcements.');
console.log('You can create a Pipedream workflow at https://pipedream.com/');
console.log('');

rl.question('Enter your Pipedream webhook URL for event announcements: ', (webhookUrl) => {
  if (!webhookUrl) {
    console.log('❌ Webhook URL is required. Setup aborted.');
    rl.close();
    return;
  }

  const envContent = readEnvFile();
  const updatedContent = addOrUpdateEnvVar(envContent, 'PIPEDREAM_WEBHOOK_URL', webhookUrl);
  updateEnvFile(updatedContent);
  
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Create a Pipedream workflow that receives webhook requests');
  console.log('2. Add steps to post to social media platforms (Facebook, LinkedIn)');
  console.log('3. Optionally add an email notification step');
  console.log('');
  console.log('Your event announcements will now be sent to Pipedream for processing!');
  
  rl.close();
}); 