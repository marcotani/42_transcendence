import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { hashPassword, verifyPassword } from '../leonardo-security/plugins/password-hash';
import { generateJWT, verifyJWT } from '../leonardo-security/plugins/jwt';
import { sanitizeUsername, sanitizeHtml } from '../utils/sanitizer';

// JWT Middleware for protected routes
export const authenticateJWT = async (request: any, reply: any) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ errorCode: 'JWT_REQUIRED', error: 'JWT token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || 'your-very-secret-key';
    const payload = verifyJWT(token, jwtSecret);

    if (!payload) {
      return reply.code(401).send({ errorCode: 'INVALID_TOKEN', error: 'Invalid or expired token' });
    }

    // Add user info to request for use in route handlers
    request.user = payload;
  } catch (error) {
    return reply.code(401).send({ errorCode: 'INVALID_TOKEN', error: 'Invalid token' });
  }
};

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/register
  app.post('/api/register', async (request, reply) => {
    const { username, password, email } = request.body as {
      username: string;
      password: string;
      email: string;
    };

    // Controlli di base
    if (!username || !password || !email) {
      return reply.code(400).send({
        success: false,
        errorCode: 'MISSING_FIELDS',
        error: 'Username, email and password are required'
      });
    }

    // Sanitizzazione input
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({
        success: false,
        errorCode: 'INVALID_USERNAME',
        error: 'Invalid username. Use only letters, numbers, _ and - (max 15 chars)'
      });
    }

    const cleanEmail = sanitizeHtml(email.trim().toLowerCase());

    // Controllo formato email (RFC 5322 compliant)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return reply.code(400).send({
        success: false,
        errorCode: 'INVALID_EMAIL',
        error: 'Invalid email format'
      });
    }

    try {
      const { hash, salt } = hashPassword(password);
      const newUser = await app.prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          password_hash: hash,
          password_salt: salt,
          online: false,
          profile: { create: { bio: '', gdpr: false, alias: cleanUsername } },
          stats: { create: {
            botWins: 0,
            botLosses: 0,
            playerWins: 0,
            playerLosses: 0,
            tournamentWins: 0
          } },
        },
        include: { profile: true, stats: true },
      });

      return reply.code(201).send({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt,
          profile: newUser.profile ?? null,
          stats: newUser.stats ?? null,
        },
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return reply.code(409).send({
          success: false,
          errorCode: 'USERNAME_OR_EMAIL_IN_USE',
          error: 'Username or email already in use'
        });
      }
      app.log.error(err);
      return reply.code(500).send({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        error: 'Internal server error'
      });
    }
  });

  // POST /api/login
  app.post('/api/login', async (request, reply) => {
    const { username, password } = request.body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return reply.code(400).send({
        success: false,
        errorCode: 'MISSING_FIELDS',
        error: 'Username and password are required'
      });
    }

    // Sanitizzazione username per login
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({
        success: false,
        errorCode: 'INVALID_USERNAME',
        error: 'Invalid username'
      });
    }

    const user = await app.prisma.user.findUnique({
      where: { username: cleanUsername },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        password_hash: true, 
        password_salt: true, 
        createdAt: true,
        twoFactorEnabled: true,
        twoFactorSecret: true
      },
    });

    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return reply.code(401).send({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        error: 'Invalid credentials'
      });
    }

    // Set online a true dopo login
    await app.prisma.user.update({
      where: { id: user.id },
      data: { online: true }
    });

    const { password_hash: _omit, password_salt: _omit2, twoFactorSecret: _omit3, ...safeUser } = user as any;
    const userResponse = { ...safeUser, online: true };

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled) {
      // For 2FA users, don't issue JWT yet - they need to verify 2FA first
      return reply.send({ 
        success: true, 
        user: userResponse,
        requiresTwoFactor: true
      });
    } else {
      // For non-2FA users, issue JWT token immediately
      const jwtSecret = process.env.JWT_SECRET || 'your-very-secret-key';
      const token = generateJWT({ userId: user.id, username: user.username }, jwtSecret, 86400);
      
      return reply.send({ 
        success: true, 
        user: userResponse,
        token: token,
        requiresTwoFactor: false
      });
    }
  });  // GET /api/users 
  app.get('/api/users', async () => {
    return app.prisma.user.findMany({
      select: { id: true, username: true, email: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  });

  // DELETE /api/users
  app.delete('/api/users', async (req, reply) => {
    try {
      await app.prisma.user.deleteMany({});
      return reply.send({
        success: true,
        message: 'All users deleted'
      });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        error: 'Error deleting users'
      });
    }
  });

  // DELETE /api/users/:username
  app.delete('/api/users/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { password } = req.body as { password: string };

    if (!password) {
      return reply.code(400).send({
        success: false,
        errorCode: 'MISSING_FIELDS',
        error: 'Password required'
      });
    }

    const user = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, password_hash: true, password_salt: true },
    });

    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return reply.code(401).send({
        success: false,
        errorCode: 'INVALID_CREDENTIALS',
        error: 'Invalid credentials'
      });
    }

    try {
      await app.prisma.user.delete({ where: { username } });
      return reply.send({
        success: true,
        message: `User ${username} deleted`
      });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        error: 'Error deleting user'
      });
    }
  });
}