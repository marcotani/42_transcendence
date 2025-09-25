import { FastifyInstance } from 'fastify';

export default async function heartbeatRoutes(app: FastifyInstance) {
  // POST /api/heartbeat
  app.post('/api/heartbeat', async (request, reply) => {
    const { userId } = request.body as {
      userId: number;
    };

    // Controllo di base
    if (!userId) {
      return reply.code(400).send({
        success: false,
        error: 'userId è obbligatorio'
      });
    }

    try {
      // Aggiorna solo il timestamp del heartbeat per l'utente
      const updatedUser = await app.prisma.user.update({
        where: { id: userId },
        data: { 
          lastHeartbeat: new Date()
        }
      });

      return reply.send({
        success: true,
        message: 'Heartbeat aggiornato',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Errore nell\'aggiornamento heartbeat:', error);
      
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return reply.code(404).send({
          success: false,
          error: 'Utente non trovato'
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'Errore interno del server'
      });
    }
  });
}