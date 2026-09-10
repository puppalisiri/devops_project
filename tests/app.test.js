const request = require('supertest');
const app = require('../app');

describe('Telangana Tourism Website Tests', () => {


    test('Homepage should return 200', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });

    test('Login page should return 200', async () => {
        const response = await request(app).get('/login');
        expect(response.statusCode).toBe(200);
    });

    test('Admin login page should return 200', async () => {
        const response = await request(app).get('/admin-login');
        expect(response.statusCode).toBe(200);
    });


});
