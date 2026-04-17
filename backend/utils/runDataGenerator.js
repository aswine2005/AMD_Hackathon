/**
 * Simple Runner Script for Test Data Generator
 * 
 * This script allows you to easily run the test data generator
 * with a simple node command.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔄 Sales Forecasting Test Data Generator 🔄');
console.log('--------------------------------------------');
console.log('This script will generate realistic test data for the sales forecasting application.');
console.log('WARNING: This will replace all existing data in your database!');
console.log('');

rl.question('Are you sure you want to proceed? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\nStarting data generation...');
    console.log('This may take a few minutes. Please wait...\n');
    
    const generatorPath = path.join(__dirname, 'testDataGenerator.js');
    
    const generator = spawn('node', [generatorPath], { 
      stdio: 'inherit',
      shell: true 
    });
    
    generator.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Test data generated successfully!');
        console.log('You can now use the application with the generated data.');
      } else {
        console.log(`\n❌ Data generator exited with code ${code}`);
        console.log('Check the logs above for any errors.');
      }
      rl.close();
    });
  } else {
    console.log('\nOperation cancelled. Your data remains unchanged.');
    rl.close();
  }
});
