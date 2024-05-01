const request = require('supertest');
const app = require('../app'); 
/*
//post crear grupo
describe('POST /grups/create', () => {
    it('should create a group', async () => {
      const res = await request(app)
        .post('/grups/create')
        .send({
            name: 'Testing', 
            descr: 'Grup creat per a fer testing',
            imatge: ' ', 
            members: ['VyRLuLpe7bNHvoP5DfuKQY1nrrw2', '2aR4ekwm4RUYdvPgteZLdSJUew04', 'lQLMXlk8ykgpaaof8J0gplno20k1']
        });
  
      expect(res.statusCode).toEqual(200);
      expect(res.text).toBe('OK');
        
      //mirar este apartado que no lo entiendo
      const docs = await db.collection('grups').where('user', '==', 'testUid').get();
      expect(docs.empty).toBeFalsy();
    });
  });

//get info grupo
describe('GET /grups/:grupId', () => {
    it('should return the info of a group', async () => {
      // Add group messages to the database
      const grupInfo = [
        {
            descripcio: 'Grup creat per a fer testing',
            id: '',
            imatge: '',
            last_msg: 'Proba dels tests',
            last_time: '2024-04-19T09:53:36.619810',
            members: ['VyRLuLpe7bNHvoP5DfuKQY1nrrw2', '2aR4ekwm4RUYdvPgteZLdSJUew04', 'lQLMXlk8ykgpaaof8J0gplno20k1'],
            nom: 'Testing' 
        },
        {
            descripcio: 'Concert de la setmana que be',
            id: '',
            imatge: '',
            last_msg: 'Bond dia',
            last_time: '2024-04-23T09:53:36.619810',
            members: ['VyRLuLpe7bNHvoP5DfuKQY1nrrw2', '2aR4ekwm4RUYdvPgteZLdSJUew04', 'lQLMXlk8ykgpaaof8J0gplno20k1'],
            nom: 'Concert'
        },
      ];
  
      for (const info of grupInfo) {
        await db.collection('grups').add(info);
      }
  
      const res = await request(app).get('/grups/:grupId');
  
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(grupInfo.length);
  
      for (const info of grupInfo) {
        expect(res.body).toContainEqual(info);
      }
    });
  });

//get grupos donde esta el user

//post mensajes

//get mensajes 
describe('GET /grups/:grupId/mensajes', () => {
    it('should return all mesages of a group', async () => {
      // Add group messages to the database
      const grupMessage = [
        {
            fecha: '2024-04-19T09:53:36.619810',
            mensaje: 'Proba dels tests',
            receiverId: ['VyRLuLpe7bNHvoP5DfuKQY1nrrw2', '2aR4ekwm4RUYdvPgteZLdSJUew04'],
            senderId: 'lQLMXlk8ykgpaaof8J0gplno20k1' 
        },
        {
            fecha: '2024-04-23T09:53:36.619810',
            mensaje: 'Bon dia',
            receiverId: ['lQLMXlk8ykgpaaof8J0gplno20k1', '2aR4ekwm4RUYdvPgteZLdSJUew04'],
            senderId: 'VyRLuLpe7bNHvoP5DfuKQY1nrrw2'
        },
      ];
  
      for (const msg of grupMessage) {
        await db.collection('grups').add(msg);
      }
  
      const res = await request(app).get('/grups/:grupId/mensajes');
  
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(grupMessage.length);
  
      for (const msg of grupMessage) {
        expect(res.body).toContainEqual(msg);
      }
    });
  });
  */