// Setup file for Jest tests
// Suppress console errors during tests
const originalError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('MongoMemoryServer') ||
        args[0].includes('jest') ||
        args[0].includes('warning'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
