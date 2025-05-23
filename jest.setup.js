// jest.setup.js
// Manual mocks in src/__mocks__/ should be picked up automatically.
// No need for jest.mock() calls here for cors, morgan, helmet, etc.
console.log('Jest global setup file loaded (mocks for app dependencies are in src/__mocks__).');
