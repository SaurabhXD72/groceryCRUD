import request from 'supertest';
import app from '../../app'; // Adjust path if your app export is elsewhere

describe('App Health Check', () => {
  it('GET /health should return 200 with status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', message: 'Server is running' });
  });
});
