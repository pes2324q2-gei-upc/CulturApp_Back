const request = require('supertest');
const app = require('../app'); 

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}


describe('POST /amics/create/', () => {
    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
        {
          uid: 'testUid2',
          username: 'testUsername2',
        },
      ];

      beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
          }    
        });

      it('debería enviar 400 porque faltan atributos', async () => {

        const res = await request(app)
        .post('/amics/create/')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
  
        expect(res.statusCode).toEqual(400);
        expect(res.text).toBe('Faltan atributos');
      });

      it('debería crear un amigo', async () => {
  
        const res = await request(app)
          .post('/amics/create/')
          .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
          .send({
            friend: 'testUsername2',
          });
    
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    
        const docs = await db.collection('following').where('user', '==', 'testUid1').get();
        expect(docs.empty).toBeFalsy();
      });
      
      it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .post('/amics/create/')
        .set('Authorization', 'Bearer testUid1')
        .send({
            friend: 'testUsername2',
        });
    
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
        });
        
        it('debería enviar 404 porque el usuario que hace la solicitud no existe', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)
            .send({
                friend: 'testUsername2',
            });
        
            expect(res.statusCode).toEqual(404);
            expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
        });
        
        it('debería enviar 404 porque el usuario que recibe la solicitud no existe', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
            .send({
                friend: 'testUsername3',
            });
        
            expect(res.statusCode).toEqual(404);
            expect(res.text).toBe('Usuario que recibe la solicitud no encontrado');
        });
        
        it('debería enviar 400 porque no puedes seguirte a ti mismo', async () => {

            const res = await request(app)
            .post('/amics/create/')
            .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
            .send({
                friend: 'testUsername1',
            });
        
            expect(res.statusCode).toEqual(400);
            expect(res.text).toBe('No puedes seguirte a ti mismo');
        });
        
        it('debería enviar 409 porque la solicitud ya ha sido enviada', async () => {

            await db.collection('following').add({ 
                'user': 'testUid1',
                'friend': 'testUid2',
                'acceptat': false,
                'pendent': true
            });

            const res = await request(app)
            .post('/amics/create/')
            .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
            .send({
                friend: 'testUsername2',
            });

            expect(res.statusCode).toEqual(409);
            expect(res.text).toBe('La solicitud ya ha sido enviada');
        });
        
});

describe('GET /amics/:id/following/', () => {

    const testUsers = [
        {
          uid: 'testUid1',
          username: 'testUsername1',
        },
        {
          uid: 'testUid2',
          username: 'testUsername2',
        },
        {
          uid: 'testUid3',
          username: 'testUsername3',
        }
    ];

    const requests = [
        {
          'user': 'testUid1',
          'friend': 'testUid2',
          'data_follow': new Date().toISOString(),
          'acceptat': false,
          'pendent': true,
        },
        {
          'user': 'testUid1',
          'friend': 'testUid3',
          'data_follow': new Date().toISOString(),
          'acceptat': true,
          'pendent': false,
        },
      ];  

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        }
        
        for (const request of requests) {
            await db.collection('following').add(request);
        }

    });   
    
    it('debería obtener todos los usuarios que sigue el usuario indicado porque lo solicita el mismo', async () => {

        const res = await request(app)
        .get('/amics/testUsername1/following/')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)

        expect(res.statusCode).toEqual(200);
        let result = [{"friend": "testUsername3",
                        "user": "testUsername1"}];
        expect(res.body).toEqual(result);
    });

    it('debería obtener todos los usuarios que sigue el usuario indicado porque es un amigo del usuario', async () => {

      const res = await request(app)
      .get('/amics/testUsername1/following/')
      .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)

      expect(res.statusCode).toEqual(200);
      let result = [{"friend": "testUsername3",
                    "user": "testUsername1"}];
      expect(res.body).toEqual(result);
     });

    
    it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .get('/amics/testUsername1/following/')
        .set('Authorization', 'Bearer testUid1')
        
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
    });
    
    it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {

        const res = await request(app)
        .get('/amics/testUsername1/following/')
        .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`)
        
        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
    });

    it('debería enviar 404 porque el usuario indicado no existe', async () => {
        const res = await request(app)
        .get('/amics/testUsername4/following/')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)

        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario no encontrado');
    });
    
});


describe('GET /amics/:id/followers/', () => {
    const testUsers = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
      },
      {
        uid: 'testUid2',
        username: 'testUsername2',
      },
      {
        uid: 'testUid3',
        username: 'testUsername3',
      }
    ];

    const requests = [
      {
        'user': 'testUid1',
        'friend': 'testUid2',
        'data_follow': new Date().toISOString(),
        'acceptat': false,
        'pendent': true,
      },
      {
        'user': 'testUid1',
        'friend': 'testUid3',
        'data_follow': "2024-05-01T17:06:23.159Z",
        'acceptat': true,
        'pendent': false,
      },
      {
        'user': 'testUid2',
        'friend': 'testUid3',
        'data_follow': "2024-06-01T17:06:23.159Z",
        'acceptat': true,
        'pendent': false,
      }, 
      {
        'user': 'testUid3',
        'friend': 'testUid2',
        'data_follow': new Date().toISOString(),
        'acceptat': true,
        'pendent': false,
      },
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        }

        for (const request of requests) {
            await db.collection('following').add(request);
        }

    });   

    it('debería obtener todos los seguidores del usuario indicado porque lo solicita el mismo', async () => {

        const res = await request(app)
        .get('/amics/testUsername3/followers/')
        .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)

        expect(res.statusCode).toEqual(200);
        let result = [{"friend": "testUsername3",
                        "user": "testUsername2"},
                      {"friend": "testUsername3",
                        "user": "testUsername1"}];
        expect(res.body).toEqual(result);
    });
    
    it('debería obtener todos los seguidores del usuario indicado porque es un amigo del usuario', async () => {

      const res = await request(app)
      .get('/amics/testUsername3/followers/')
      .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`)

      expect(res.statusCode).toEqual(200);
      let result = [{"friend": "testUsername3",
                      "user": "testUsername2"},
                    {"friend": "testUsername3",
                      "user": "testUsername1"}];
      expect(res.body).toEqual(result);
    });


    it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .get('/amics/testUsername3/followers/')
        .set('Authorization', 'Bearer testUid1')
        
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
    });

    it('debería enviar 404 porque el usuario indicado no existe', async () => {
        const res = await request(app)
        .get('/amics/testUsername4/followers/')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)

        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario no encontrado');
    });

    it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {

        const res = await request(app)
        .get('/amics/testUsername3/followers/')
        .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`)
        
        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
    });
    
});


describe('GET /amics/:id/pendents', () => {
  const testUsers = [
    {
      uid: 'testUid1',
      username: 'testUsername1',
    },
    {
      uid: 'testUid2',
      username: 'testUsername2',
    },
    {
      uid: 'testUid3',
      username: 'testUsername3',
    }  
  ];

  const requests = [
    {
      'user': 'testUid1',
      'friend': 'testUid2',
      'data_follow': new Date().toISOString(),
      'acceptat': false,
      'pendent': true,
    },
    {
      'user': 'testUid1',
      'friend': 'testUid3',
      'data_follow': new Date().toISOString(),
      'acceptat': true,
      'pendent': false,
    }
  ];

  beforeEach(async () => {
      for (const usuari of testUsers) {
          await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
      }
      
      for (const request of requests) {
          await db.collection('following').add(request);
      }

  });   

  it('debería obtener todos los usuarios pendientes de aceptar el usuario indicado porque lo solicita el mismo', async () => {

      const res = await request(app)
      .get('/amics/testUsername2/pendents')
      .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`)

      expect(res.statusCode).toEqual(200);
      let result = [{"friend": "testUsername2",
                      "user": "testUsername1"}];
      expect(res.body).toEqual(result);
  });

  it('debería enviar 401 porque el token no es válido', async () => {

      const res = await request(app)
      .get('/amics/testUsername2/pendents')
      .set('Authorization', 'Bearer testUid2')
      
      expect(res.statusCode).toEqual(401);
      expect(res.text).toBe('Token inválido');
  });

  it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {

      const res = await request(app)
      .get('/amics/testUsername2/pendents')
      .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`)
      
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
  });

  it('debería enviar 404 porque el usuario indicado no existe', async () => {
      const res = await request(app)
      .get('/amics/testUsername4/pendents')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)

      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuario no encontrado');

  });

  it('debería enviar 401 porque el usuario solicitador no tiene permiso para ver los pendientes de aceptar del usuario indicado', async () => {
      
        const res = await request(app)
        .get('/amics/testUsername2/pendents')
        .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)
        
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('No tienes permiso para ver los pendientes a aceptar de este usuario');
  }); 
});

describe('PUT /amics/accept/:id', () => {
    const testUsers = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
      },
      {
        uid: 'testUid2',
        username: 'testUsername2',
      },
      {
        uid: 'testUid3',
        username: 'testUsername3',
      }
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        }
        
        await db.collection('following').add({
            'user': 'testUid1',
            'friend': 'testUid2',
            'acceptat': false,
            'pendent': true,
        });

        await db.collection('following').add({
            'user': 'testUid1',
            'friend': 'testUid3',
            'acceptat': true,
            'pendent': false,
        });

    });
    
    it('debería aceptar la solicitud de amistad', async () => {

        const res = await request(app)
        .put('/amics/accept/testUsername1')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`)

        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    });

    it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .put('/amics/accept/testUsername1')
        .set('Authorization', 'Bearer testUid2')

        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
    });

    it('debería enviar 404 porque el usuario indicado no existe', async () => {
        
          const res = await request(app)
          .put('/amics/accept/testUsername4')
          .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)

          expect(res.statusCode).toEqual(404);
          expect(res.text).toBe('Usuario no encontrado');
    });

    it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {

        const res = await request(app)
        .put('/amics/accept/testUsername1')
        .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`)

        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
    });

    it('debería enviar 404 porque no se ha encontrado la solicitud de amistad', async () => {
        
          const res = await request(app)
          .put('/amics/accept/testUsername2')
          .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)

          expect(res.statusCode).toEqual(404);
          expect(res.text).toBe('No se ha encontrado la solicitud de amistad');
    });

    it('debería enviar 409 porque la solicitud ya ha sido aceptada', async () => {
        
          const res = await request(app)
          .put('/amics/accept/testUsername1')
          .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)

          expect(res.statusCode).toEqual(409);
          expect(res.text).toBe('La solicitud de amistad ya ha sido aceptada');

    });

});


describe('DELETE /amics/delete/:id', () => {
    const testUsers = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
      },  
      {
        uid: 'testUid2',
        username: 'testUsername2',
      },
      {
        uid: 'testUid3',
        username: 'testUsername3'
      }
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        }
        
        await db.collection('following').add({
            'user': 'testUid1',
            'friend': 'testUid2',
            'acceptat': false,
            'pendent': true,
        });

        await db.collection('following').add({
            'user': 'testUid1',
            'friend': 'testUid3',
            'acceptat': true,
            'pendent': false,
        });

    });
    
    it('debería rechazar la solicitud de amistad', async () => {

        const res = await request(app)
        .delete('/amics/delete/testUsername1')
        .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`)

        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    });
    
    it('debería enviar 401 porque el token no es válido', async () => {

        const res = await request(app)
        .delete('/amics/delete/testUsername1')
        .set('Authorization', 'Bearer testUid2')

        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
    });

    it('debería enviar 404 porque el usuario indicado no existe', async () => {
        
          const res = await request(app)
          .delete('/amics/delete/testUsername4')
          .set('Authorization', `Bearer ${encrypt('testUid2').encryptedData}`)

          expect(res.statusCode).toEqual(404);
          expect(res.text).toBe('Usuario no encontrado');
    });

    it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {

        const res = await request(app)
        .delete('/amics/delete/testUsername1')
        .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`)

        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
    });

    it('debería enviar 400 porque no puedes rechazarte a ti mismo', async () => {
        
          const res = await request(app)
          .delete('/amics/delete/testUsername1')
          .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)

          expect(res.statusCode).toEqual(400);
          expect(res.text).toBe('No puedes rechazarte a ti mismo');
    });

    it('debería enviar 404 porque no se ha encontrado la solicitud de amistad', async () => {
          
            const res = await request(app)
            .delete('/amics/delete/testUsername2')
            .set('Authorization', `Bearer ${encrypt('testUid3').encryptedData}`)

            expect(res.statusCode).toEqual(404);
            expect(res.text).toBe('No se ha encontrado la solicitud de amistad');
    });
    
});

describe('DELETE /amics/deleteFollowing/:id', () => {
    const testUsers = [
      {
        uid: 'testUid1',
        username: 'testUsername1',
      },
      {
        uid: 'testUid2',
        username: 'testUsername2',
      },
      {
        uid: 'testUid3',
        username: 'testUsername3',
      }
    ];

    const following = [
      {
        'user': 'testUid1',
        'friend': 'testUid2',
        'data_follow': new Date().toISOString(),
        'acceptat': false,
        'pendent': true,
      },
    ];

    beforeEach(async () => {
        for (const usuari of testUsers) {
            await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
        }

        for (const follow of following) {
            await db.collection('following').add(follow);
        }
    });

    it('debería eliminar el following', async () => {
      const res = await request(app)
        .delete('/amics/deleteFollowing/testUsername2')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('OK');
    });

    it('debería enviar 401 porque el token no es válido', async () => {
        const res = await request(app)
        .delete('/amics/deleteFollowing/testUsername2')
        .set('Authorization', 'Bearer testUid1');

        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
    });

    it('debería enviar 404 porque el usuario indicado no existe', async () => {
        const res = await request(app)
        .delete('/amics/deleteFollowing/testUsername4')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario no encontrado');
    });

    it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {
        const res = await request(app)
        .delete('/amics/deleteFollowing/testUsername2')
        .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`);

        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
    });

    it('debería enviar 404 porque no se ha encontrado el following', async () => {
        const res = await request(app)
        .delete('/amics/deleteFollowing/testUsername3')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(res.statusCode).toEqual(404);
        expect(res.text).toBe('No se ha encontrado la solicitud de amistad');
    });

    it('debería enviar 400 porque no puedes eliminarte a ti mismo', async () => {
        const res = await request(app)
        .delete('/amics/deleteFollowing/testUsername1')
        .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`);

        expect(res.statusCode).toEqual(400);
        expect(res.text).toBe('No puedes eliminarte a ti mismo');
    });

});

describe('GET /amics/followingRequests' , () => {
  const testUsers = [
    {
      uid: 'testUid1',
      username: 'testUsername1',
    },
    {
      uid: 'testUid2',
      username: 'testUsername2',
    },
    {
      uid: 'testUid3',
      username: 'testUsername3',
    }  
  ];

  const requests = [
    {
      'user': 'testUid1',
      'friend': 'testUid2',
      'data_follow': new Date().toISOString(),
      'acceptat': false,
      'pendent': true,
    },
    {
      'user': 'testUid1',
      'friend': 'testUid3',
      'data_follow': new Date().toISOString(),
      'acceptat': true,
      'pendent': false,
    }
  ];

  beforeEach(async () => {
      for (const usuari of testUsers) {
          await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
      }
      
      for (const request of requests) {
          await db.collection('following').add(request);
      }
  }); 
  it('debería obtener todas las solicitudes de amistad pendientes de aceptar', async () => {

      const res = await request(app)
      .get('/amics/followingRequests')
      .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)

      expect(res.statusCode).toEqual(200); 
      let result = [{"friend": "testUsername2",
                      "user": "testUsername1"}];
      expect(res.body).toEqual(result);
  });
  it('debería enviar 401 porque el token no es válido', async () => {
      
        const res = await request(app)
        .get('/amics/followingRequests')
        .set('Authorization', 'Bearer testUid2')
        expect(res.statusCode).toEqual(401);
        expect(res.text).toBe('Token inválido');
  });
  it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {

      const res = await request(app)
      .get('/amics/followingRequests')
      .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`)
      
      expect(res.statusCode).toEqual(404);
      expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});
describe('GET /user/:id/isFriend', () =>{
  const testUsers = [
    {
      uid: 'testUid1',
      username: 'testUsername1',
    },
    {
      uid: 'testUid2',
      username: 'testUsername2',
    },
    {
      uid: 'testUid3',
      username: 'testUsername3',
    }  
  ];

  const requests = [
    {
      'user': 'testUid1',
      'friend': 'testUid2',
      'data_follow': new Date().toISOString(),
      'acceptat': true,
      'pendent': false,
    },
    {
      'user': 'testUid1',
      'friend': 'testUid3',
      'data_follow': new Date().toISOString(),
      'acceptat': false,
      'pendent': true,
    }
  ];
  beforeEach(async () => {
      for (const usuari of testUsers) {
          await db.collection('users').doc(usuari.uid).set({"username": usuari.username});
      }
      
      for (const request of requests) {
          await db.collection('following').add(request);
      }
  });

  it('debería enviar 200 y true porque son amigos', async () => {
    const res = await request(app)
    .get('/amics/user/testUsername2/isFriend')
    .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBe(true);
  });
  it('debería enviar 200 y false porque no son amigos', async () => {
    const res = await request(app)
    .get('/amics/user/testUsername3/isFriend')
    .set('Authorization', `Bearer ${encrypt('testUid1').encryptedData}`)
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBe(false);
  });
  it('debería enviar 401 porque el token no es válido', async () => {
    const res = await request(app)
    .get('/amics/user/testUsername2/isFriend')
    .set('Authorization', 'Bearer testUid1')
    expect(res.statusCode).toEqual(401);
    expect(res.text).toBe('Token inválido');
  });
  it('debería enviar 404 porque el usuario que ha hecho la solicitud no existe', async () => {
    const res = await request(app)
    .get('/amics/user/testUsername2/isFriend')
    .set('Authorization', `Bearer ${encrypt('testUid4').encryptedData}`)
    expect(res.statusCode).toEqual(404);
    expect(res.text).toBe('Usuario que envió la solicitud no encontrado');
  });
});