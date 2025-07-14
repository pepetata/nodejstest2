const Joi = require('joi');

// Updated validation schema to accept both field formats
const operatingHoursSchema = Joi.array().items(
  Joi.object({
    day: Joi.string().required(),
    // Accept both formats - frontend uses open_time/close_time, backend uses open/close
    open_time: Joi.string().allow(''),
    close_time: Joi.string().allow(''),
    is_closed: Joi.boolean(),
    open: Joi.string().allow(''),
    close: Joi.string().allow(''),
    closed: Joi.boolean(),
  })
    .or('open_time', 'open')
    .or('close_time', 'close')
    .or('is_closed', 'closed')
);

// Test cases
const testCases = [
  // Case 1: Frontend format with empty holiday hours
  [
    { day: 'monday', open_time: '09:00', close_time: '17:00', is_closed: false },
    { day: 'tuesday', open_time: '', close_time: '', is_closed: true },
    { day: 'wednesday', open_time: '09:00', close_time: '17:00', is_closed: false },
  ],

  // Case 2: Backend format with empty holiday hours
  [
    { day: 'monday', open: '09:00', close: '17:00', closed: false },
    { day: 'tuesday', open: '', close: '', closed: true },
    { day: 'wednesday', open: '09:00', close: '17:00', closed: false },
  ],

  // Case 3: Mixed format (should work)
  [
    { day: 'monday', open_time: '09:00', close_time: '17:00', is_closed: false },
    { day: 'tuesday', open: '', close: '', closed: true },
  ],
];

console.log('Testing validation schema...\n');

testCases.forEach((testCase, index) => {
  console.log(`Test Case ${index + 1}:`);
  console.log(JSON.stringify(testCase, null, 2));

  const { error, value } = operatingHoursSchema.validate(testCase);

  if (error) {
    console.log('❌ Validation failed:', error.message);
  } else {
    console.log('✅ Validation passed');
  }
  console.log('---\n');
});
