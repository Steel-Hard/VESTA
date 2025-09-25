import request from 'supertest';
import app from '../app';

describe('GET /ping', () => {
  it('should respond with pong', async () => {
    const response = await request(app).get('/ping');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('pong');
  });
});
