#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Testing complete basketball stats app setup...\n');

const tests = [
  {
    name: 'API TypeScript compilation',
    command: 'npm run lint',
    cwd: './api'
  },
  {
    name: 'API build',
    command: 'npm run build',
    cwd: './api'
  },
  {
    name: 'Frontend build',
    command: 'npm run build',
    cwd: './web'
  }
];

async function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${test.name}...`);
    
    exec(test.command, { cwd: test.cwd }, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ${test.name} failed:`);
        console.log(stderr || error.message);
        reject(error);
      } else {
        console.log(`✅ ${test.name} passed`);
        resolve();
      }
    });
  });
}

async function runAllTests() {
  try {
    for (const test of tests) {
      await runTest(test);
    }
    
    console.log('\n🎉 All tests passed! Setup is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Set up your PostgreSQL database');
    console.log('2. Copy .env.example files and configure your environment');
    console.log('3. Run database migrations: cd api && npm run db:migrate');
    console.log('4. Seed the database: npm run db:seed');
    console.log('5. Start development: npm run dev (in both api/ and web/)');
    
  } catch (error) {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

runAllTests();