/**
 * Validation utility functions for API endpoints
 */

/**
 * Validates a date string and returns a Date object if valid
 * @param dateString The date string to validate
 * @returns An object with the parsed date and validation info
 */
export const validateDate = (dateString: string) => {
  if (!dateString) {
    return {
      isValid: false,
      error: 'Date is required',
      date: null
    };
  }

  const parsedDate = new Date(dateString);
  
  if (isNaN(parsedDate.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format',
      date: null
    };
  }

  return {
    isValid: true,
    error: null,
    date: parsedDate
  };
};

/**
 * Validates that a date range is valid (start date comes before end date)
 * @param startDate The start date
 * @param endDate The end date
 * @returns An object with validation info
 */
export const validateDateRange = (startDate: Date, endDate: Date) => {
  if (endDate < startDate) {
    return {
      isValid: false,
      error: 'End date cannot be before start date'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Validates an amount value
 * @param amount The amount to validate
 * @returns An object with the parsed amount and validation info
 */
export const validateAmount = (amount: string | number) => {
  if (amount === undefined || amount === null) {
    return {
      isValid: false,
      error: 'Amount is required',
      amount: null
    };
  }
  
  let parsedAmount: number;
  
  if (typeof amount === 'string') {
    parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return {
        isValid: false,
        error: 'Amount must be a valid number',
        amount: null
      };
    }
  } else if (typeof amount === 'number') {
    parsedAmount = amount;
  } else {
    return {
      isValid: false,
      error: 'Amount must be a number',
      amount: null
    };
  }
  
  if (parsedAmount <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than zero',
      amount: null
    };
  }
  
  return {
    isValid: true,
    error: null,
    amount: parsedAmount
  };
};

/**
 * Validates required fields
 * @param fields An object containing field names and values
 * @param requiredFields An array of field names that are required
 * @returns An object with validation info
 */
export const validateRequiredFields = (
  fields: Record<string, any>,
  requiredFields: string[]
) => {
  const missingFields = requiredFields.filter(field => !fields[field]);
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }
  
  return {
    isValid: true,
    error: null,
    missingFields: []
  };
};

/**
 * Validates expense data
 * @param expenseData Object containing expense data
 * @returns Validation result and processed expense data if valid
 */
export const validateExpense = (expenseData: Record<string, any>) => {
  // Validate required fields
  const requiredFields = ['title', 'amount', 'currency', 'date'];
  const requiredValidation = validateRequiredFields(expenseData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return {
      isValid: false,
      error: requiredValidation.error,
      details: `Required fields: ${requiredFields.join(', ')}`,
      missingFields: requiredValidation.missingFields
    };
  }
  
  // Validate amount
  const amountValidation = validateAmount(expenseData.amount);
  if (!amountValidation.isValid) {
    return {
      isValid: false,
      error: amountValidation.error,
      details: 'Amount must be a positive number'
    };
  }
  
  // Validate date
  const dateValidation = validateDate(expenseData.date);
  if (!dateValidation.isValid) {
    return {
      isValid: false,
      error: dateValidation.error,
      details: 'Date must be in a valid format (YYYY-MM-DD)'
    };
  }
  
  // Return processed data with correct types
  return {
    isValid: true,
    error: null,
    data: {
      ...expenseData,
      amount: amountValidation.amount,
      date: dateValidation.date
    }
  };
};

/**
 * Validates task data
 * @param taskData Object containing task data
 * @returns Validation result and processed task data if valid
 */
export const validateTask = (taskData: Record<string, any>) => {
  // Validate required fields
  const requiredFields = ['title', 'description', 'dueDate'];
  const requiredValidation = validateRequiredFields(taskData, requiredFields);
  
  if (!requiredValidation.isValid) {
    return {
      isValid: false,
      error: requiredValidation.error,
      details: `Required fields: ${requiredFields.join(', ')}`,
      missingFields: requiredValidation.missingFields
    };
  }
  
  // Validate dates
  const dueDateValidation = validateDate(taskData.dueDate);
  if (!dueDateValidation.isValid) {
    return {
      isValid: false,
      error: dueDateValidation.error,
      details: 'Due date must be in a valid format (YYYY-MM-DD)'
    };
  }
  
  // Initialize startDate with today if not provided
  let startDate = new Date();
  if (taskData.startDate) {
    const startDateValidation = validateDate(taskData.startDate);
    if (!startDateValidation.isValid) {
      return {
        isValid: false,
        error: startDateValidation.error,
        details: 'Start date must be in a valid format (YYYY-MM-DD)'
      };
    }
    startDate = startDateValidation.date;
  }
  
  // Validate date range
  const dateRangeValidation = validateDateRange(startDate, dueDateValidation.date);
  if (!dateRangeValidation.isValid) {
    return {
      isValid: false,
      error: dateRangeValidation.error,
      details: 'Due date cannot be before start date'
    };
  }
  
  // Validate priority if provided
  if (taskData.priority && !['HIGH', 'MEDIUM', 'LOW'].includes(taskData.priority)) {
    return {
      isValid: false,
      error: 'Invalid priority value',
      details: 'Priority must be one of: HIGH, MEDIUM, LOW'
    };
  }
  
  // Validate status if provided
  if (taskData.status && !['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].includes(taskData.status)) {
    return {
      isValid: false,
      error: 'Invalid status value',
      details: 'Status must be one of: TODO, IN_PROGRESS, BLOCKED, COMPLETED'
    };
  }
  
  // Return processed data with correct types
  return {
    isValid: true,
    error: null,
    data: {
      ...taskData,
      dueDate: dueDateValidation.date,
      startDate,
      priority: taskData.priority || 'MEDIUM',
      status: taskData.status || 'TODO'
    }
  };
}; 