/**
 * Test utility script for API endpoints
 * 
 * This script tests the task and milestone API endpoints by making requests to them
 * Run this script with: node scripts/test-helpers/test-endpoints.js
 * 
 * Note: This requires you to be logged in and have proper permissions
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Fetch wrapper to help with testing
 */
const api = {
  async get(path) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    return {
      status: response.status,
      data: await response.json().catch(() => null)
    };
  },
  
  async post(path, data) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    return {
      status: response.status,
      data: await response.json().catch(() => null)
    };
  }
};

/**
 * Test the milestone endpoints
 */
async function testMilestones(startupId) {
  console.log('\n==== Testing Milestone Endpoints ====');
  
  // Test GET milestones
  console.log('Fetching milestones...');
  const getMilestonesResult = await api.get(`/startups/${startupId}/milestones`);
  console.log(`Status: ${getMilestonesResult.status}`);
  console.log(`Number of milestones: ${getMilestonesResult.data?.length || 0}`);
  
  // Test CREATE milestone with valid data
  console.log('\nCreating valid milestone...');
  const validMilestone = {
    title: `Test Milestone ${Date.now()}`,
    description: 'Test description created with test script',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in the future
    status: 'PENDING'
  };
  
  const createValidResult = await api.post(`/startups/${startupId}/milestones`, validMilestone);
  console.log(`Status: ${createValidResult.status}`);
  console.log(`Created milestone ID: ${createValidResult.data?.id || 'FAILED'}`);
  
  // Test CREATE milestone with invalid data (missing description)
  console.log('\nCreating invalid milestone (missing description)...');
  const invalidMilestone1 = {
    title: `Test Milestone ${Date.now()}`,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  const createInvalidResult1 = await api.post(`/startups/${startupId}/milestones`, invalidMilestone1);
  console.log(`Status: ${createInvalidResult1.status} (Expected: 400)`);
  console.log(`Error message: ${createInvalidResult1.data?.message || 'No error message'}`);
  
  // Test CREATE milestone with invalid date
  console.log('\nCreating invalid milestone (invalid date)...');
  const invalidMilestone2 = {
    title: `Test Milestone ${Date.now()}`,
    description: 'Test description',
    dueDate: 'not-a-date'
  };
  
  const createInvalidResult2 = await api.post(`/startups/${startupId}/milestones`, invalidMilestone2);
  console.log(`Status: ${createInvalidResult2.status} (Expected: 400)`);
  console.log(`Error message: ${createInvalidResult2.data?.message || 'No error message'}`);
  
  return createValidResult.data?.id;
}

/**
 * Test the task endpoints
 */
async function testTasks(startupId, milestoneId) {
  console.log('\n==== Testing Task Endpoints ====');
  
  // Test GET tasks
  console.log('Fetching tasks...');
  const getTasksResult = await api.get(`/startups/${startupId}/tasks`);
  console.log(`Status: ${getTasksResult.status}`);
  console.log(`Number of tasks: ${getTasksResult.data?.length || 0}`);
  
  // Test CREATE task with valid data
  console.log('\nCreating valid task...');
  const validTask = {
    title: `Test Task ${Date.now()}`,
    description: 'Test description created with test script',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days in the future
    status: 'TODO',
    priority: 'MEDIUM',
    milestoneId
  };
  
  const createValidResult = await api.post(`/startups/${startupId}/tasks`, validTask);
  console.log(`Status: ${createValidResult.status}`);
  console.log(`Created task ID: ${createValidResult.data?.id || 'FAILED'}`);
  
  // Test CREATE task with invalid data (missing description)
  console.log('\nCreating invalid task (missing description)...');
  const invalidTask1 = {
    title: `Test Task ${Date.now()}`,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  const createInvalidResult1 = await api.post(`/startups/${startupId}/tasks`, invalidTask1);
  console.log(`Status: ${createInvalidResult1.status} (Expected: 400)`);
  console.log(`Error message: ${createInvalidResult1.data?.message || 'No error message'}`);
  
  // Test CREATE task with invalid date range (due date before start date)
  console.log('\nCreating invalid task (invalid date range)...');
  const invalidTask2 = {
    title: `Test Task ${Date.now()}`,
    description: 'Test description',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in the future
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()    // 14 days in the future
  };
  
  const createInvalidResult2 = await api.post(`/startups/${startupId}/tasks`, invalidTask2);
  console.log(`Status: ${createInvalidResult2.status} (Expected: 400)`);
  console.log(`Error message: ${createInvalidResult2.data?.message || 'No error message'}`);
}

/**
 * Main test function
 */
async function runTests() {
  // You need to provide a valid startup ID to test with
  const startupId = process.argv[2];
  
  if (!startupId) {
    console.log('Please provide a startup ID as an argument:');
    console.log('node scripts/test-helpers/test-endpoints.js YOUR_STARTUP_ID');
    return;
  }
  
  try {
    console.log(`Running tests with startup ID: ${startupId}`);
    
    // Test milestones first to get a milestone ID for task testing
    const milestoneId = await testMilestones(startupId);
    
    // Test tasks if milestone creation was successful
    if (milestoneId) {
      await testTasks(startupId, milestoneId);
    } else {
      console.log('\nSkipping task tests because milestone creation failed');
    }
    
    console.log('\n==== All Tests Completed ====');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 