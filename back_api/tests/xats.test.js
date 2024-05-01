const request = require('supertest');
const app = require('../app'); 
/*
//post crear xat

//post mensajes

//get mensajes 
describe('GET /xats/:xatId/mensajes', () => {
    it('should return all mesages of a xat', async () => {
      // Add xats messages to the database
      const xatsMessage = [
        {
            fecha: '2024-03-19T09:53:36.619810',
            mensaje: 'Hola',
            receiverId: '2aR4ekwm4RUYdvPgteZLdSJUew04',
            senderId: 'VyRLuLpe7bNHvoP5DfuKQY1nrrw2', 
        },
        {
            fecha: '2024-04-19T10:53:36.619810',
            mensaje: 'Bona tarda',
            receiverId: 'VyRLuLpe7bNHvoP5DfuKQY1nrrw2',
            senderId: 'lQLMXlk8ykgpaaof8J0gplno20k1', 
        },
      ];
  
      for (const msg of xatsMessage) {
        await db.collection('xats').add(msg);
      }
  
      const res = await request(app).get('/xats/:xatId/mensajes');
  
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(xatsMessage.length);
  
      for (const msg of xatsMessage) {
        expect(res.body).toContainEqual(msg);
      }
    });
  });
  */