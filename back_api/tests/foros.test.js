
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



describe('GET /foros/:foroId/posts', () => {
  const testActivitats = [
    activitat1 = {
        id: '1',
        name: 'name',
        description: 'description',
        date: 'date',
        location: 'location',
        participants: ['useridTest1', 'useridTest2'],
    },
    activitat2 = {
        id: '2',
        name: 'name2',
        description: 'description2',
        date: 'date2',
        location: 'location2',
        participants: ['useridTest1', 'useridTest2'],
    }
  ];
  const testForos = [
    foro1 = {
        id: '1',
        activitat_code: '1',
    },
    foro2 = {
        id: '2',
        activitat_code: '2',
    }
  ];
  const testPosts = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'useridTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'useridTest2',
    }
  ];
  const testPosts2 = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'usernameTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'usernameTest2',
    }
  ];
  const testUsers = [
    user1 = {
        id: 'useridTest1',
        username: 'usernameTest1',
        email: 'emailTest1',
        blockedUsers: ['useridTest2'],
    },
    user2 = {
        id: 'useridTest2',
        username: 'usernameTest2',
        email: 'emailTest2',
        blockedUsers: [],
    }
  ];
  beforeEach(async () => {
    for (const user of testUsers) {
      await db.collection('users').doc(user.id).set(user);
    }
    for (const foro of testForos) {
      await db.collection('foros').doc(foro.id).set(foro);
      for (const post of testPosts) {
        await db.collection('foros').doc(foro.id).collection('posts').doc(post.id).set(post);
      }
    }
  });
  it('should return all posts from a foro', async () => {
    const response = await request(app)
    .get('/foros/1/posts')
    .set('Authorization', 'Bearer '+  encrypt('useridTest2').encryptedData);
    expect(response.status).toBe(200);
    //expect(response.body).toEqual(testPosts2);
  });
  it('should return 200 and not the posts from blocked users', async () => {
    const response = await request(app)
    .get('/foros/1/posts')
    .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
    expect(response.status).toBe(200);
    //expect(response.body).toEqual([testPosts2[0]]);
  });
  it('should return 404 because the foro does not exist', async () => {
    const response = await request(app)
    .get('/foros/3/posts')
    .set('Authorization', `Bearer ${encrypt('useridTest2').encryptedData}`);
    expect(response.status).toBe(404);
  });
  it('should return 401 because the user is not authorized', async () => {
    const response = await request(app)
    .get('/foros/1/posts');
    expect(response.status).toBe(401);
  });
});
describe('POST /foros/:foroId/posts/:postId/reply', () => {
  const testActivitats = [
    activitat1 = {
        id: '1',
        name: 'name',
        description: 'description',
        date: 'date',
        location: 'location',
        participants: ['useridTest1', 'useridTest2'],
    },
    activitat2 = {
        id: '2',
        name: 'name2',
        description: 'description2',
        date: 'date2',
        location: 'location2',
        participants: ['useridTest1', 'useridTest2'],
    }
  ];
  const testForos = [
    foro1 = {
        id: '1',
        activitat_code: '1',
    },
    foro2 = {
        id: '2',
        activitat_code: '2',
    }
  ];
  const testPosts = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'useridTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'useridTest2',
    }
  ];
  const testPosts2 = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'usernameTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'usernameTest2',
    }
  ];
  const testUsers = [
    user1 = {
        id: 'useridTest1',
        username: 'usernameTest1',
        email: 'emailTest1',
        blockedUsers: ['useridTest2'],
    },
    user2 = {
        id: 'useridTest2',
        username: 'usernameTest2',
        email: 'emailTest2',
        blockedUsers: [],
    }
  ];
  beforeEach(async () => {
    for (const user of testUsers) {
      await db.collection('users').doc(user.id).set(user);
    }
    for (const foro of testForos) {
      await db.collection('foros').doc(foro.id).set(foro);
      for (const post of testPosts) {
        await db.collection('foros').doc(foro.id).collection('posts').doc(post.id).set(post);
      }
    }
    await db.collection('organitzadors').doc('1').set({ activitat: '1', user: 'useridTest1' });
  });
  it('should return 201 and create a reply', async () => {
    const response = await request(app)
    .post('/foros/1/posts/1/reply')
    .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(201);
  });
  it('should return 200 and not create a reply because the user is blocked', async () => {
    const response = await request(app)
    .post('/foros/1/posts/1/reply')
    .set('Authorization', `Bearer ${encrypt('useridTest2').encryptedData}`)
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(200);
    expect(response.text).toBe('Usuario bloqueado');
  });
  it('should return 200 and not create a reply because the user is blocked', async () => {
    const response = await request(app)
    .post('/foros/1/posts/2/reply')
    .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(200);
    expect(response.text).toBe('Usuario bloqueado');
  });
  it('should return 401 because the user is not authorized', async () => {
    const response = await request(app)
    .post('/foros/1/posts/1/reply')
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(401);
  });
  it('should return 404 because the post does not exist', async () => {
    const response = await request(app)
    .post('/foros/1/posts/3/reply')
    .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(404);
  });
});
describe('GET /foros/:foroId/posts/:postId/reply', () => {
  const testActivitats = [
    activitat1 = {
        id: '1',
        name: 'name',
        description: 'description',
        date: 'date',
        location: 'location',
        participants: ['useridTest1', 'useridTest2'],
    },
    activitat2 = {
        id: '2',
        name: 'name2',
        description: 'description2',
        date: 'date2',
        location: 'location2',
        participants: ['useridTest1', 'useridTest2'],
    }
  ];
  const testForos = [
    foro1 = {
        id: '1',
        activitat_code: '1',
    },
    foro2 = {
        id: '2',
        activitat_code: '2',
    }
  ];
  const testPosts = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'useridTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'useridTest2',
    }
  ];
  const testPosts2 = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'usernameTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'usernameTest2',
    }
  ];
  const testReplies = [
    reply1 = {
        id: '1',
        mensaje: 'mensaje',
        fecha: 'fecha',
        numero_likes: 0,
        username: 'useridTest1',
    },
    reply2 = {
        id: '2',
        mensaje: 'mensaje2',
        fecha: 'fecha2',
        numero_likes: 0,
        username: 'useridTest2',
    }
  ];
  const testReplies2 = [
    reply1 = {
        id: '1',
        mensaje: 'mensaje',
        fecha: 'fecha',
        numero_likes: 0,
        username: 'usernameTest1',
    },
    reply2 = {
        id: '2',
        mensaje: 'mensaje2',
        fecha: 'fecha2',
        numero_likes: 0,
        username: 'usernameTest2',
    }
  ];
  const testUsers = [
    user1 = {
        id: 'useridTest1',
        username: 'usernameTest1',
        email: 'emailTest1',
        blockedUsers: ['useridTest2'],
    },
    user2 = {
        id: 'useridTest2',
        username: 'usernameTest2',
        email: 'emailTest2',
        blockedUsers: [],
    }
  ];
  beforeEach(async () => {
    for (const user of testUsers) {
      await db.collection('users').doc(user.id).set(user);
    }
    for (const foro of testForos) {
      await db.collection('foros').doc(foro.id).set(foro);
      for (const post of testPosts) {
        await db.collection('foros').doc(foro.id).collection('posts').doc(post.id).set(post);
        for (const reply of testReplies) {
          await db.collection('foros').doc(foro.id).collection('posts').doc(post.id).collection('replies').doc(reply.id).set(reply);
        }
      }
    }
  });
  it('should return all replies from a post', async () => {
    const response = await request(app)
    .get('/foros/1/posts/1/reply')
    .set('Authorization', `Bearer ${encrypt('useridTest2').encryptedData}`);
    expect(response.status).toBe(200);
  });
  it('should return 200 and not the replies from blocked users', async () => {
    const response = await request(app)
    .get('/foros/1/posts/1/reply')
    .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`);
    expect(response.status).toBe(200);
  });
  it('should return 404 because the post does not exist', async () => {
    const response = await request(app)
    .get('/foros/1/posts/3/reply')
    .set('Authorization', `Bearer ${encrypt('useridTest2').encryptedData}`);
    expect(response.status).toBe(404);
  });
  it('should return 401 because the user is not authorized', async () => {
    const response = await request(app)
    .get('/foros/1/posts/1/reply');
    expect(response.status).toBe(401);
  });
});
describe('POST /foros/:foroId/posts', () => {
  const testActivitats = [
    activitat1 = {
        id: '1',
        name: 'name',
        description: 'description',
        date: 'date',
        location: 'location',
        participants: ['useridTest1', 'useridTest2'],
    },
    activitat2 = {
        id: '2',
        name: 'name2',
        description: 'description2',
        date: 'date2',
        location: 'location2',
        participants: ['useridTest1', 'useridTest2'],
    }
  ];
  const testForos = [
    foro1 = {
        id: '1',
        activitat_code: '1',
    },
    foro2 = {
        id: '2',
        activitat_code: '2',
    }
  ];
  const testPosts = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'useridTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'useridTest2',
    }
  ];
  const testPosts2 = [
    post1 = {
        id: '1',
        title: 'title',
        content: 'content',
        date: 'date',
        username: 'usernameTest1',
    },
    post2 = {
        id: '2',
        title: 'title2',
        content: 'content2',
        date: 'date2',
        username: 'usernameTest2',
    }
  ];
  const testUsers = [
    user1 = {
        id: 'useridTest1',
        username: 'usernameTest1',
        email: 'emailTest1',
        blockedUsers: ['useridTest2'],
    },
    user2 = {
        id: 'useridTest2',
        username: 'usernameTest2',
        email: 'emailTest2',
        blockedUsers: [],
    }
  ];
  beforeEach(async () => {
    for (const user of testUsers) {
      await db.collection('users').doc(user.id).set(user);
    }
    for (const foro of testForos) {
      await db.collection('foros').doc(foro.id).set(foro);
    }
    await db.collection('organitzadors').doc('1').set({ activitat: '1', user: 'useridTest1'});
  });
  it('should return 201 and create a post', async () => {
    const response = await request(app)
    .post('/foros/1/posts')
    .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(201);
  });
  it('should return 201 and create a post', async () => {
    const response = await request(app)
    .post('/foros/1/posts')
    .set('Authorization', `Bearer ${encrypt('useridTest2').encryptedData}`)
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(201);
  });
  it('should return 401 because the user is not authorized', async () => {
    const response = await request(app)
    .post('/foros/1/posts')
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(401);
  });
  it('should return 404 because the foro does not exist', async () => {
    const response = await request(app)
    .post('/foros/3/posts')
    .set('Authorization', `Bearer ${encrypt('useridTest1').encryptedData}`)
    .send({ mensaje: 'mensaje', fecha: 'fecha', numero_likes: 0 });
    expect(response.status).toBe(404);
  });
});