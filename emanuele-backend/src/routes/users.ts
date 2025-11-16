import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { authenticateJWT } from './auth';
import { generateJWT } from '../leonardo-security/plugins/jwt';
import { sanitizeUsername, sanitizeAlias, sanitizeBio, sanitizeHtml, sanitizePassword } from '../utils/sanitizer';

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

const usersRoute: FastifyPluginAsync = async (app) => {
  
  // Creazione utente
  app.post('/users', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { email: string; username: string; password?: string };
    
    // Controllo campi del body
    if (!body?.email || !body?.username) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Missing fields: email and username are required' });
    }
    
    // Sanitizzazione e controllo formato email e username
    const cleanUsername = sanitizeUsername(body.username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }

    const cleanEmail = sanitizeHtml(body.email.trim().toLowerCase());
    // Controllo formato email (RFC 5322 compliant)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return reply.code(400).send({ errorCode: 'INVALID_EMAIL', error: 'Invalid email format' });
    }
    
    try {
      // Creazione utente tramite i parametri passati
      let hash, salt;
      if (body.password) {
        const cleanPassword = sanitizePassword(body.password);
        if (!cleanPassword) {
          return reply.code(400).send({ errorCode: 'INVALID_PASSWORD', error: 'Invalid password. Min 8, max 128 characters, no control characters' });
        }
        const result = await import('../leonardo-security/plugins/password-hash');
        ({ hash, salt } = result.hashPassword(cleanPassword));
      }
      const user = await app.prisma.user.create({
        data: {
          email: cleanEmail,
          username: cleanUsername,
          password_hash: hash ?? "",
          password_salt: salt ?? "",
          online: false,
          profile: { create: { bio: '', alias: cleanUsername, gdpr: false } },
          stats: { create: {} }
        },
        select: { id: true, username: true, email: true, createdAt: true }
      });
      
      return reply.code(201).send(user);
      
    } catch (err: any) {
      // Errore nel caso di username o email già utilizzati
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return reply.code(409).send({ errorCode: 'USERNAME_OR_EMAIL_IN_USE', error: 'Email or username already in use' });
      }
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });
  
  // Comando per recuperare un utente specifico, se esistente, dal database
  app.get('/users/:username', async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }
    const user = await app.prisma.user.findUnique({
      where: { username: cleanUsername },
      select: {
        id: true,
        username: true,
        email: true,
        twoFactorEnabled: true,
        createdAt: true,
        profile: {
          select: {
            alias: true,
            avatarUrl: true,
            bio: true,
            skinColor: true,
            gdpr: true,
            emailVisible: true
          }
        },
        stats: {
          select: {
            botWins: true,
            botLosses: true,
            playerWins: true,
            playerLosses: true,
            tournamentWins: true
          }
        }
      }
    });
    if (!user) {
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    // Escape any profile fields before returning to prevent XSS
    if (user.profile) {
      user.profile.alias = sanitizeHtml(user.profile.alias ?? '');
      user.profile.bio = sanitizeHtml(user.profile.bio ?? '');
    }
    if (user.profile && (user.profile.gdpr === true || user.profile.emailVisible === false)) {
      user.email = '*************';
    }
    return user;
  });

  // Comando per stampare l'intero database
  app.get('/users', async () => {
    const users = await app.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        twoFactorEnabled: true,
        createdAt: true,
        profile: {
          select: {
            alias: true,
            avatarUrl: true,
            bio: true,
            skinColor: true,
            gdpr: true,
            emailVisible: true
          }
        },
        stats: {
          select: {
            botWins: true,
            botLosses: true,
            playerWins: true,
            playerLosses: true,
            tournamentWins: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    for (const user of users) {
      if (user.profile) {
        user.profile.alias = sanitizeHtml(user.profile.alias ?? '');
        user.profile.bio = sanitizeHtml(user.profile.bio ?? '');
      }
      if (user.profile && (user.profile.gdpr === true || user.profile.emailVisible === false)) {
        user.email = '*************';
      }
    }
    return users;
  });
  
  // Comando per eliminare tutti i profili sul database
  app.delete('/users', async (_req: FastifyRequest, reply: FastifyReply) => {
    const isDev = process.env.NODE_ENV === 'development' || process.env.DEV_ROUTES === 'true';
    if (!isDev) {
      return reply.code(403).send({ success: false, errorCode: 'DEV_ONLY_ROUTE', error: 'This endpoint is available in development only' });
    }
    await app.prisma.user.deleteMany({});
    return reply.send({ message: 'All users deleted successfully' });
  });
  
  // Comando per eliminare un utente specifico sul database
  app.delete('/users/:username', async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }
    const { password } = req.body as { password?: string };
    
    if (!password) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Password is required' });
    }
    const cleanPassword = sanitizePassword(password);
    if (!cleanPassword) return reply.code(400).send({ errorCode: 'INVALID_PASSWORD', error: 'Invalid password' });

  const user = await app.prisma.user.findUnique({ where: { username: cleanUsername }, select: { password_hash: true, password_salt: true } });
    if (!user) {
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(cleanPassword, user.password_salt, user.password_hash)) {
      return reply.code(401).send({ errorCode: 'INVALID_CREDENTIALS', error: 'Invalid password' });
    }
    
    await app.prisma.user.delete({ where: { username: cleanUsername } });
    return reply.send({ message: `User '${cleanUsername}' deleted successfully` });
  });
  
  // Comando per modificare l'alias di un utente
  app.patch('/users/:username/alias', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const { alias } = req.body as { alias?: string };

    console.log('[PATCH] /users/:username/alias called for', username, 'body:', { alias });
    console.log('Auth user (from token):', (req as any).user);

    // Ensure authenticated user matches target username
    const authUser = (req as any).user;
    if (!authUser || authUser.username !== username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }
    
    if (!alias || alias.trim() === '') {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Alias is required' });
    }

    // Sanitizzazione username e alias
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }

    const cleanAlias = sanitizeAlias(alias);
    if (!cleanAlias) {
      return reply.code(400).send({ errorCode: 'INVALID_ALIAS', error: 'Invalid alias. Max 15 characters, only letters, numbers, spaces, _ and - are allowed' });
    }
    
    const user = await app.prisma.user.findUnique({
      where: { username: cleanUsername },
      include: { profile: true }
    });
    
    if (!user) {
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    
    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { alias: cleanAlias }
    });
    
    return reply.send({ message: `Alias updated successfully for ${cleanUsername}`, alias: cleanAlias });
  });

  // PATCH per cambiare solo la skin (colore) del player
  app.patch('/users/:username/skin', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }
    const { skinColor } = req.body as { skinColor?: string };
    const authUser = (req as any).user;
    if (!authUser || authUser.username !== username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }
    // 5 colori predefiniti
    const allowedColors = [
      '#FF0000', // rosso
      '#00FF00', // verde
      '#0000FF', // blu
      '#FFFF00', // giallo
      '#FF00FF',  // magenta
      '#FFFFFF'   // bianco
    ];
    if (!skinColor || !allowedColors.includes(skinColor)) {
      return reply.code(400).send({ errorCode: 'INVALID_SKIN_COLOR', error: 'skinColor must be one of: ' + allowedColors.join(', ') });
    }
    // Trova utente e aggiorna skinColor
  const user = await app.prisma.user.findUnique({ where: { username: cleanUsername }, select: { id: true } });
    if (!user) {
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { skinColor }
    });
    return reply.send({ success: true, skinColor });
  });

  // Rotta per accettare GDPR
  app.patch('/users/:username/gdpr', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }
    const { password } = req.body as { password?: string };
    const authUser = (req as any).user;
    if (!authUser || authUser.username !== username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }
    if (!password)
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Password is required' });

    const cleanPassword = sanitizePassword(password);
    if (!cleanPassword) return reply.code(400).send({ errorCode: 'INVALID_PASSWORD', error: 'Invalid password' });

    const user = await app.prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user)
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(cleanPassword, user.password_salt, user.password_hash))
      return reply.code(401).send({ errorCode: 'INVALID_CREDENTIALS', error: 'Invalid password' });
    await app.prisma.profile.update({ where: { userId: user.id }, data: { gdpr: true } });
    return reply.send({ success: true, message: 'GDPR flag set to true' });
  });

  // Rotta per abilitare 2FA (ora protetta da JWT)
  app.post('/users/:username/2fa/enable', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }

    // Verify user matches token (token username assumed already validated elsewhere)
    if ((req as any).user.username !== cleanUsername) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    const user = await app.prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user) {
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    
    if (user.twoFactorEnabled) {
      return reply.code(400).send({ errorCode: 'ALREADY_2FA_ENABLED', error: '2FA is already enabled' });
    }
    
    const { generate2FASecret } = await import('../leonardo-security/plugins/two-factors-authentication');
    const secret = generate2FASecret();
    
    // Store the secret in the database for verification, but don't enable 2FA yet
    await app.prisma.user.update({
      where: { id: user.id },
      data: { 
        twoFactorSecret: secret,
        twoFactorEnabled: false // Keep disabled until verification
      }
    });
    
    // Generate proper QR code for TOTP
    const QRCode = require('qrcode');
    const appName = 'Transcendence'; // Your app name
    const issuer = 'Transcendence'; // Your organization/service name
    const otpUrl = `otpauth://totp/${issuer}:${user.username}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    
    const qrcode = await QRCode.toDataURL(otpUrl);
    
    // Return the secret for setup
    return reply.send({ 
      success: true, 
      secret, 
      qrcode,
      message: 'Scan QR code and verify with authenticator app' 
    });
  });

  // Rotta per disabilitare 2FA (ora protetta da JWT)
  app.post('/users/:username/2fa/disable', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }

    // Verify user matches token
    if ((req as any).user.username !== cleanUsername) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    const user = await app.prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user) {
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    
    if (!user.twoFactorEnabled) {
      return reply.code(400).send({ errorCode: 'NOT_2FA_ENABLED', error: '2FA is not enabled' });
    }
    
    await app.prisma.user.update({ 
      where: { id: user.id }, 
      data: { twoFactorEnabled: false, twoFactorSecret: null } 
    });
    
    return reply.send({ success: true, message: '2FA disabled successfully' });
  });

  // Rotta per verificare il codice TOTP di un utente (e abilitare 2FA se setup)
  app.post('/users/:username/2fa/verify', {
    config: { rateLimit: { max: 6, timeWindow: '1 minute' } }
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }
    const { code } = req.body as { code: string };
    const user = await app.prisma.user.findUnique({ where: { username: cleanUsername } });
    if (!user || !user.twoFactorSecret)
      return reply.code(400).send({ errorCode: 'INVALID_2FA_SETUP', error: '2FA secret not found or user not found' });
    
    const { verifyTOTP } = await import('../leonardo-security/plugins/two-factors-authentication');
    if (verifyTOTP(user.twoFactorSecret, code))
    {
      // If 2FA isn't enabled yet, enable it now (for setup process)
      if (!user.twoFactorEnabled) {
        await app.prisma.user.update({ 
          where: { id: user.id }, 
          data: { twoFactorEnabled: true } 
        });
      }
      
      // Invia il JWT
      const { generateJWT } = await import('../leonardo-security/plugins/jwt');
      const jwtSecret = process.env.JWT_SECRET || 'your-very-secret-key';
      const token = generateJWT({ userId: user.id, username: user.username }, jwtSecret, 86400);
      return reply.send({ success: true, token });
    }
    else
      return reply.code(401).send({ errorCode: 'INVALID_2FA_CODE', error: 'Invalid 2FA code' });
  });
  
  // Comando per modificare username, email o password
  // dopo aver controllato che la password passata sia corretta per l'utente
  app.patch('/users/:username', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
        const authUser = (req as any).user;
        if (!authUser || authUser.username !== username) {
          return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
        }
    // Validate and sanitize username early
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }
    const {
      currentPassword,
      newUsername,
      newEmail,
      newPassword,
    } = req.body as {
      currentPassword: string;
      newUsername?: string;
      newEmail?: string;
      newPassword?: string;
    };

    if (!currentPassword) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'currentPassword is required'});
    }
    if (!newUsername && !newEmail && !newPassword) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'Provide at least one field to update (newUsername, newEmail, newPassword).' });
    }
    if (newEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(newEmail)) {
        return reply.code(400).send({ errorCode: 'INVALID_EMAIL', error: 'Invalid email format' });
      }
    }
    // ricerca dell profilo all interno del database
    const user = await app.prisma.user.findUnique({
      where: { username: cleanUsername },
      select: { id: true, username: true, email: true, password_hash: true, password_salt: true, createdAt: true },
    });
    if (!user) {
      return reply.code(400).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    const { verifyPassword, hashPassword } = await import('../leonardo-security/plugins/password-hash');
    const cleanCurrentPassword = sanitizePassword(currentPassword);
    if (!cleanCurrentPassword || !verifyPassword(cleanCurrentPassword, user.password_salt, user.password_hash)) {
      return reply.code(400).send({ errorCode: 'INVALID_CREDENTIALS', error: 'Invalid current password' });
    }

    const data: Record<string, any> = {};
    if (typeof newUsername === 'string' && newUsername.trim() !== '') {
      const cleanNewUsername = sanitizeUsername(newUsername.trim());
      if (!cleanNewUsername) {
        return reply.code(400).send({ errorCode: 'INVALID_NEW_USERNAME', error: 'Invalid new username' });
      }
      data.username = cleanNewUsername;
    }
    if (typeof newEmail === 'string') data.email = newEmail;
    if (typeof newPassword === 'string' && newPassword.trim() !== '') {
      const cleanNewPassword = sanitizePassword(newPassword);
      if (!cleanNewPassword) {
        return reply.code(400).send({ errorCode: 'INVALID_NEW_PASSWORD', error: 'Invalid new password' });
      }
      const { hash, salt } = hashPassword(cleanNewPassword);
      data.password_hash = hash;
      data.password_salt = salt;
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ errorCode: 'NO_VALID_CHANGES', error: 'No valid changes provided' });
    }

    // 4) Esecuzione di update su prisma 
    try {
      const updated = await app.prisma.user.update({
        where: { id: user.id },
        data,
        select: { id: true, username: true, email: true, createdAt: true },
      });

      // Issue a new JWT token reflecting potential username change so the client
      // can continue making authenticated requests with the updated identity.
      try {
        const jwtSecret = process.env.JWT_SECRET || 'your-very-secret-key';
        const token = generateJWT({ userId: updated.id, username: updated.username }, jwtSecret, 86400);
        return reply.send({ success: true, user: updated, token });
      } catch (tokenErr) {
        // If token generation fails for any reason, still return updated user.
        // Log a stringified error to satisfy logger typings and avoid TS overload issues.
        app.log.warn('Failed to generate JWT after username update: ' + String(tokenErr));
        return reply.send({ success: true, user: updated });
      }
    } catch (err: any) {
      if (err?.code === 'P2002') {
        // Messaggio di errore nel caso username o email siano già utilizzati
        return reply.code(409).send({ errorCode: 'USERNAME_OR_EMAIL_IN_USE', error: 'Username or email already in use' });
      }
      app.log.error(err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // comando per cambiare immagine profilo
  app.patch('/users/:username/avatar', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    // Ensure authenticated user matches target username
    const authUser = (req as any).user;
    if (!authUser || authUser.username !== username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    // Validate and sanitize username
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }

    try {
      const data = await req.file();
      
      if (!data) {
        return reply.code(400).send({ errorCode: 'NO_FILE_UPLOADED', error: 'No file uploaded' });
      }
      
      if (!ALLOWED_MIME.has(data.mimetype)) {
        return reply.code(400).send({ errorCode: 'INVALID_FILE_TYPE', error: 'Only PNG/JPEG/WebP allowed' });
      }

      // trova utente (no password verification needed for avatar)
      const user = await app.prisma.user.findUnique({
        where: { username: cleanUsername },
        select: { id: true },
      });
      if (!user) {
        return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
      }

      // Salva nuova immagine usando buffer
      const ext = data.filename?.split('.').pop()?.toLowerCase() || 'png';
      const filename = `${user.id}-${crypto.randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, filename);

      await fs.promises.mkdir(uploadDir, { recursive: true });
      
      // Leggi il file in un buffer
      const buffer = await data.toBuffer();
      
      // Scrivi il buffer su disco
      await fs.promises.writeFile(filePath, buffer);

      // URL del file su uploads
      const publicUrl = `/uploads/${filename}`;

      // Aggiorna profilo
      await app.prisma.profile.update({
        where: { userId: user.id },
        data: { avatarUrl: publicUrl },
      });

  return reply.send({ success: true, avatarUrl: publicUrl });
      
    } catch (error) {
      console.error('Avatar upload error:', error);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Internal server error' });
    }
  });

  // comando per resettare immagine profilo a default
  app.patch('/users/:username/avatar/reset', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    const { currentPassword } = req.body as { currentPassword?: string };
    const authUser = (req as any).user;
    if (!authUser || authUser.username !== username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    if (!currentPassword) {
      return reply.code(400).send({ errorCode: 'MISSING_FIELDS', error: 'currentPassword is required' });
    }

    const user = await app.prisma.user.findUnique({
      where: { username: cleanUsername },
      select: { id: true, password_hash: true, password_salt: true },
    });
  if (!user) return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    const cleanCurrentPassword = sanitizePassword(currentPassword ?? '');
    if (!cleanCurrentPassword) return reply.code(400).send({ errorCode: 'INVALID_PASSWORD', error: 'Invalid current password' });
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(cleanCurrentPassword, user.password_salt, user.password_hash)) {
      return reply.code(401).send({ errorCode: 'INVALID_CREDENTIALS', error: 'Invalid current password' });
    }

    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { avatarUrl: '/static/default_avatar.png' },
    });

    return reply.send({ success: true, avatarUrl: '/static/default_avatar.png' });
  });

  app.patch('/users/:username/bio', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const { bio } = req.body as { bio?: string };
    const authUser = (req as any).user;
    console.log('[PATCH] /users/:username/bio called for', username, 'body:', { bio });
    console.log('Auth user (from token):', authUser);
    if (!authUser || authUser.username !== username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }
    
    if (typeof bio !== 'string') {
      return reply.code(400).send({ errorCode: 'INVALID_BIO_TYPE', error: 'Bio must be a string' });
    }

    // Sanitizzazione username
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return reply.code(400).send({ errorCode: 'INVALID_USERNAME', error: 'Invalid username' });
    }

    // Sanitizzazione bio (può essere vuota)
    const cleanBio = sanitizeBio(bio);
    if (cleanBio === null) {
      return reply.code(400).send({ errorCode: 'INVALID_BIO', error: 'Invalid bio. Max 50 characters, punctuation allowed' });
    }

    const user = await app.prisma.user.findUnique({ where: { username: cleanUsername }, select: { id: true } });
    if (!user) {
      return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
    }
    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { bio: cleanBio }
    });
    return reply.send({ success: true, bio: cleanBio });
  });

  // Update email visibility
  app.patch('/users/:username/email-visibility', { preHandler: authenticateJWT }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { username } = req.params as { username: string };
    const { emailVisible } = req.body as { emailVisible: boolean };
    const authUser = (req as any).user;
    if (!authUser || authUser.username !== username) {
      return reply.code(403).send({ errorCode: 'UNAUTHORIZED', error: 'Access denied' });
    }

    if (typeof emailVisible !== 'boolean') {
      return reply.code(400).send({ errorCode: 'INVALID_EMAIL_VISIBLE_TYPE', error: 'emailVisible must be a boolean' });
    }

    try {
      const user = await app.prisma.user.findUnique({
        where: { username },
        select: { id: true }
      });

      if (!user) {
        return reply.code(404).send({ errorCode: 'USER_NOT_FOUND', error: 'User not found' });
      }

      await app.prisma.profile.update({
        where: { userId: user.id },
        data: { emailVisible }
      });

      return reply.send({ success: true, emailVisible });
    } catch (err: any) {
      console.error('Error updating email visibility:', err);
      return reply.code(500).send({ errorCode: 'INTERNAL_SERVER_ERROR', error: 'Failed to update email visibility' });
    }
  });
};

export default usersRoute;
