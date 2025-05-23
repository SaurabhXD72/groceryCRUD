// src/__mocks__/swagger-ui-express.ts
export const serve = [(req: any, res: any, next: any) => next()]; // serve can be an array of middleware
export const setup = jest.fn(() => (req: any, res: any, next: any) => next());
// If other properties like swaggerUi.serveFiles are used, mock them too.
