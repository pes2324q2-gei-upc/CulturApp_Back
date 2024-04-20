// tests/tickets.test.js
const request = require('supertest');
const app = require('../app'); // Importa tu app de Express

describe('POST /tickets/create/reportUsuari', () => {
  it('should create a user report', async () => {
    const res = await request(app)
      .post('/tickets/create/reportUsuari')
      .send({
        uid: 'testUid',
        report: 'testReport',
        usuariReportat: 'testUsuariReportat',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('OK');

    // También puedes hacer una consulta a Firestore para verificar que el reporte se creó correctamente
    const docs = await db.collection('reportsUsuaris').where('user', '==', 'testUid').get();
    expect(docs.empty).toBeFalsy();
  });
});