// src/__mocks__/morgan.ts
// morgan is a function that takes format string and options
// and returns a middleware function.
const mockMorgan = () => (req: any, res: any, next: any) => next();
mockMorgan.compile = jest.fn(); // If any properties like .compile are used
mockMorgan.format = jest.fn();
mockMorgan.token = jest.fn();
export default mockMorgan;
