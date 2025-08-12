import { FastifyPluginAsync } from 'fastify';

const usersRoute: FastifyPluginAsync = async (app) => {
  // ➕ Crea utente
  //riceve una richiesta POST e si aspetta un body con: email, username e password(opzionale)
  app.post('/users', async (req, reply) => {
    const body = req.body as { email: string; username: string; password?: string };
    //se mancano delle informazioni obbligatorie allora restituisce errore 400
    if (!body?.email || !body?.username) {
      return reply.code(400).send({ error: 'Missing fields: email and username are required' });
    }

    const user = await app.prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        password: body.password ?? null, // se non messa inizializza la password a null
        profile: { create: {} },
        stats: { create: {} }
      }
    });

    return reply.code(201).send(user); //restituisce l'utente creato con codice 201
  });

  // 📋 Lista utenti
  //recupera tutti gli utenti nel database
  app.get('/users', async () => {
    return app.prisma.user.findMany({
      include: { profile: true, stats: true }
    });
  });
};

export default usersRoute; //registra le rotte nel server principale

