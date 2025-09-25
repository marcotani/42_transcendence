import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);

const usersRoute: FastifyPluginAsync = async (app) => {
  
  // Creazione utente
  app.post('/users', async (req, reply) => {
    const body = req.body as { email: string; username: string; password?: string };
    
    // Controllo campi del body
    if (!body?.email || !body?.username) {
      return reply.code(400).send({ error: 'Missing fields: email and username are required' });
    }
    
    // Controllo formato email (RFC 5322 compliant)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(body.email)) {
      return reply.code(400).send({ error: 'Invalid email format' });
    }
    
    try {
      // Creazione utente tramite i parametri passati
      let hash, salt;
      if (body.password) {
        const result = await import('../leonardo-security/plugins/password-hash');
        ({ hash, salt } = result.hashPassword(body.password));
      }
      const user = await app.prisma.user.create({
        data: {
          email: body.email,
          username: body.username,
          password_hash: hash ?? "",
          password_salt: salt ?? "",
          online: false,
          profile: { create: { bio: '', alias: '', gdpr: false } },
          stats: { create: {} }
        }
      });
      
      return reply.code(201).send(user);
      
    } catch (err: any) {
      // Errore nel caso di username o email già utilizzati
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return reply.code(409).send({ error: 'Email or username already in use' });
      }
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
  
  // Comando per recuperare un utente specifico, se esistente, dal database
  app.get('/users/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    const user = await app.prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    if (user.profile?.gdpr === true) {
      user.email = '*************';
    }
    return user;
  });

  // Comando per stampare l'intero database
  app.get('/users', async () => {
    const users = await app.prisma.user.findMany({
      include: { profile: true, stats: true }
    });
    for (const user of users) {
      if (user.profile?.gdpr === true) {
        user.email = '*************';
      }
    }
    return users;
  });
  
  // Comando per eliminare tutti i profili sul database
  app.delete('/users', async (_, reply) => {
    await app.prisma.user.deleteMany({});
    return reply.send({ message: 'All users deleted successfully' });
  });
  
  // Comando per eliminare un utente specifico sul database
  app.delete('/users/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { password } = req.body as { password?: string };
    
    if (!password) {
      return reply.code(400).send({ error: 'Password is required' });
    }
    
    const user = await app.prisma.user.findUnique({ where: { username }, select: { password_hash: true, password_salt: true } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(password, user.password_salt, user.password_hash)) {
      return reply.code(401).send({ error: 'Invalid password' });
    }
    
    await app.prisma.user.delete({ where: { username } });
    return reply.send({ message: `User '${username}' deleted successfully` });
  });
  
  // Comando per modificare l'alias di un utente
  app.patch('/users/:username/alias', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { alias } = req.body as { alias?: string };
    
    if (!alias || alias.trim() === '') {
      return reply.code(400).send({ error: 'Alias is required' });
    }
    
    const user = await app.prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });
    
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    
    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { alias }
    });
    
    return reply.send({ message: `Alias updated successfully for ${username}`, alias });
  });

  // PATCH per cambiare solo la skin (colore) del player
  app.patch('/users/:username/skin', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { skinColor } = req.body as { skinColor?: string };
    // 5 colori predefiniti
    const allowedColors = [
      '#FF0000', // rosso
      '#00FF00', // verde
      '#0000FF', // blu
      '#FFFF00', // giallo
      '#FF00FF'  // magenta
    ];
    if (!skinColor || !allowedColors.includes(skinColor)) {
      return reply.code(400).send({ error: 'skinColor must be one of: ' + allowedColors.join(', ') });
    }
    // Trova utente e aggiorna skinColor
    const user = await app.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { skinColor }
    });
    return reply.send({ success: true, skinColor });
  });

  // Rotta per accettare GDPR
  app.patch('/users/:username/gdpr', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { password } = req.body as { password?: string };
    if (!password) {
      return reply.code(400).send({ error: 'Password is required' });
    }
  const user = await app.prisma.user.findUnique({ where: { username } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(password, user.password_salt, user.password_hash)) {
      return reply.code(401).send({ error: 'Invalid password' });
    }
    await app.prisma.profile.update({ where: { userId: user.id }, data: { gdpr: true } });
    return reply.send({ success: true, message: 'GDPR flag set to true' });
  });

  // Rotta per abilitare/disabilitare 2FA
  app.patch('/users/:username/2fa', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { password } = req.body as { password?: string };
    if (!password) {
      return reply.code(400).send({ error: 'Password is required' });
    }
  const user = await app.prisma.user.findUnique({ where: { username } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(password, user.password_salt, user.password_hash)) {
      return reply.code(401).send({ error: 'Invalid password' });
    }
    if (!user.twoFactorEnabled) {
      const { generate2FASecret } = await import('../leonardo-security/plugins/two-factors-authentication');
      await app.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true, twoFactorSecret: generate2FASecret() } });
      return reply.send({ success: true, message: '2FA enabled successfully' });
    }
    await app.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    return reply.send({ success: true, message: '2FA disabled successfully' });
  });
  
  // Comando per modificare username, email o password
  // dopo aver controllato che la password passata sia corretta per l'utente
  app.patch('/users/:username', async (req, reply) => {
    const { username } = req.params as { username: string };
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
      return reply.code(400).send({ error: 'currentPassword is required'});
    }
    if (!newUsername && !newEmail && !newPassword) {
      return reply.code(400).send({ error: 'Provide at least one field to update (newUsername, newEmail, newPassword).' });
    }
    if (newEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(newEmail)) {
        return reply.code(400).send({ error: 'Invalid email format' });
      }
    }
    // ricerca dell profilo all interno del database
    const user = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true, password_hash: true, password_salt: true, createdAt: true },
    });
    if (!user) {
      return reply.code(400).send({ error: 'User not found' });
    }
    const { verifyPassword, hashPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(currentPassword, user.password_salt, user.password_hash)) {
      return reply.code(400).send({ error: 'Invalid current password' });
    }

    const data: Record<string, any> = {};
    if (typeof newUsername === 'string' && newUsername.trim() !== '') data.username = newUsername.trim();
    if (typeof newEmail === 'string') data.email = newEmail;
    if (typeof newPassword === 'string' && newPassword.trim() !== '') {
      const { hash, salt } = hashPassword(newPassword);
      data.password_hash = hash;
      data.password_salt = salt;
    }

    if (Object.keys(data).length === 0) {
      return reply.code(400).send({ error: 'No valid changes provided' });
    }

    // 4) Esecuzione di update su prisma 
    try {
      const updated = await app.prisma.user.update({
        where: { id: user.id },
        data,
        select: { id: true, username: true, email: true, createdAt: true },
      });
      return reply.send({ success: true, user: updated });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        // Messaggio di errore nel caso username o email siano già utilizzati
        return reply.code(409).send({ error: 'Username or email already in use' });
      }
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // comando per cambiare immagine profilo
  app.patch('/users/:username/avatar', async (req, reply) => {
    const { username } = req.params as { username: string };

    try {
      const data = await req.file();
      
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }
      
      if (!ALLOWED_MIME.has(data.mimetype)) {
        return reply.code(400).send({ error: 'Only PNG/JPEG/WebP allowed' });
      }

      // trova utente (no password verification needed for avatar)
      const user = await app.prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
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
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // comando per resettare immagine profilo a default
  app.patch('/users/:username/avatar/reset', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { currentPassword } = req.body as { currentPassword?: string };

    if (!currentPassword) {
      return reply.code(400).send({ error: 'currentPassword is required' });
    }

    const user = await app.prisma.user.findUnique({
      where: { username },
      select: { id: true, password_hash: true, password_salt: true },
    });
    if (!user) return reply.code(404).send({ error: 'User not found' });
    const { verifyPassword } = await import('../leonardo-security/plugins/password-hash');
    if (!verifyPassword(currentPassword, user.password_salt, user.password_hash)) {
      return reply.code(401).send({ error: 'Invalid current password' });
    }

    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { avatarUrl: '/static/default-avatar.png' },
    });

    return reply.send({ success: true, avatarUrl: '/static/default-avatar.png' });
  });

  app.patch('/users/:username/bio', async (req, reply) => {
    const { username } = req.params as { username: string };
    const { bio } = req.body as { bio?: string };
    if (typeof bio !== 'string' || bio.trim() === '') {
      return reply.code(400).send({ error: 'Bio is required' });
    }
    const user = await app.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    await app.prisma.profile.update({
      where: { userId: user.id },
      data: { bio: bio.trim() }
    });
    return reply.send({ success: true, bio: bio.trim() });
  });
};

export default usersRoute;
