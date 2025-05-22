/**
 * Test utility script for validation functions and API endpoints
 * 
 * Run this script with: node scripts/test-helpers/test-validation.js
 */

const { validateAmount, validateDate, validateDateRange, validateRequiredFields } = require('../../lib/validation');

// Test validateDate
console.log('\n==== Testing validateDate ====');
console.log('Valid date:', validateDate('2023-12-31'));
console.log('Invalid date:', validateDate('not-a-date'));
console.log('Empty date:', validateDate(''));
console.log('Null date:', validateDate(null));

// Test validateDateRange
console.log('\n==== Testing validateDateRange ====');
console.log('Valid range:', validateDateRange(new Date('2023-01-01'), new Date('2023-12-31')));
console.log('Invalid range:', validateDateRange(new Date('2023-12-31'), new Date('2023-01-01')));
console.log('Same date:', validateDateRange(new Date('2023-01-01'), new Date('2023-01-01')));

// Test validateAmount
console.log('\n==== Testing validateAmount ====');
console.log('Valid number amount:', validateAmount(100));
console.log('Valid string amount:', validateAmount('100'));
console.log('Invalid string amount:', validateAmount('not-a-number'));
console.log('Negative amount:', validateAmount(-100));
console.log('Zero amount:', validateAmount(0));
console.log('Empty amount:', validateAmount(''));
console.log('Null amount:', validateAmount(null));

// Test validateRequiredFields
console.log('\n==== Testing validateRequiredFields ====');
console.log('All fields present:', validateRequiredFields(
  { title: 'Test', description: 'Test description', amount: 100 },
  ['title', 'description', 'amount']
));
console.log('Missing fields:', validateRequiredFields(
  { title: 'Test', amount: 100 },
  ['title', 'description', 'amount']
));
console.log('Empty fields:', validateRequiredFields(
  { title: 'Test', description: '', amount: 100 },
  ['title', 'description', 'amount']
));

// Test mock expense validation
console.log('\n==== Testing Mock Expense Validation ====');
const mockExpense = {
  title: 'Test Expense',
  description: 'Test description',
  amount: 100,
  currency: 'USD',
  date: '2023-12-31',
  categoryId: 'cat123',
  budgetId: 'budget123',
  userId: 'user123',
};

const validateExpense = (expense) => {
  // Validate required fields
  const requiredValidation = validateRequiredFields(
    expense,
    ['title', 'amount', 'currency', 'date', 'budgetId', 'userId']
  );
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate amount
  const amountValidation = validateAmount(expense.amount);
  if (!amountValidation.isValid) {
    return amountValidation;
  }
  
  // Validate date
  const dateValidation = validateDate(expense.date);
  if (!dateValidation.isValid) {
    return dateValidation;
  }
  
  return { isValid: true, expense: { ...expense, amount: amountValidation.amount, date: dateValidation.date } };
};

console.log('Valid expense:', validateExpense(mockExpense));
console.log('Missing fields:', validateExpense({ ...mockExpense, title: '' }));
console.log('Invalid amount:', validateExpense({ ...mockExpense, amount: 'not-a-number' }));
console.log('Invalid date:', validateExpense({ ...mockExpense, date: 'not-a-date' }));

// Test mock task validation
console.log('\n==== Testing Mock Task Validation ====');
const mockTask = {
  title: 'Test Task',
  description: 'Test description',
  dueDate: '2023-12-31',
  startDate: '2023-01-01',
  status: 'TODO',
  priority: 'MEDIUM',
  assignedToId: 'user123',
  startupId: 'startup123',
  milestoneId: 'milestone123',
};

const validateTask = (task) => {
  // Validate required fields
  const requiredValidation = validateRequiredFields(
    task,
    ['title', 'description', 'dueDate', 'startupId']
  );
  
  if (!requiredValidation.isValid) {
    return requiredValidation;
  }
  
  // Validate dates
  const dueDateValidation = validateDate(task.dueDate);
  if (!dueDateValidation.isValid) {
    return dueDateValidation;
  }
  
  // Validate start date if provided
  let startDate = new Date();
  if (task.startDate) {
    const startDateValidation = validateDate(task.startDate);
    if (!startDateValidation.isValid) {
      return startDateValidation;
    }
    startDate = startDateValidation.date;
  }
  
  // Validate date range
  const dateRangeValidation = validateDateRange(startDate, dueDateValidation.date);
  if (!dateRangeValidation.isValid) {
    return dateRangeValidation;
  }
  
  return { 
    isValid: true, 
    task: { 
      ...task, 
      dueDate: dueDateValidation.date, 
      startDate 
    } 
  };
};

console.log('Valid task:', validateTask(mockTask));
console.log('Missing fields:', validateTask({ ...mockTask, title: '' }));
console.log('Invalid due date:', validateTask({ ...mockTask, dueDate: 'not-a-date' }));
console.log('Invalid date range:', validateTask({ 
  ...mockTask, 
  startDate: '2023-12-31', 
  dueDate: '2023-01-01' 
}));

console.log('\nAll tests completed.'); 