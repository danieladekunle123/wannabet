import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { getIo } from '../lib/socket';

const router = Router();

// list conversations for authenticated user
router.get('/conversations', requireAuth, async (req: any, res) => {
  const userId = req.user.userId;
  // fetch recent messages involving the user and derive conversation keys
  const msgs = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const convoMap: Record<string, any> = {};

  for (const m of msgs) {
    let key: string;
    let meta: any = {};
    if (m.channelId) {
      key = `channel:${m.channelId}`;
      meta.type = 'channel';
      meta.channelId = m.channelId;
    } else if (m.receiverId) {
      // direct message: deterministic key based on participants
      const pair = [m.senderId, m.receiverId].sort().join(':');
      key = `dm:${pair}`;
      meta.type = 'dm';
      meta.participants = pair.split(':');
    } else {
      // fallback to sender-based key
      key = `user:${m.senderId}`;
      meta.type = 'user';
      meta.participants = [m.senderId];
    }

    if (!convoMap[key]) {
      convoMap[key] = {
        key,
        lastMessage: m.content,
        lastAt: m.createdAt,
        meta,
      };
    }
  }

  const convos = Object.values(convoMap);
  return res.json({ data: convos });
});

// fetch messages for a conversation
router.get('/:conversationId', requireAuth, async (req: any, res) => {
  const { conversationId } = req.params;
  // if conversationId is a dm: key, also include legacy direct messages
  let messages;
  if (conversationId.startsWith('dm:')) {
    const parts = conversationId.replace(/^dm:/, '').split(':');
    if (parts.length === 2) {
      const [a, b] = parts;
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { channelId: conversationId },
            { AND: [{ senderId: a }, { receiverId: b }] },
            { AND: [{ senderId: b }, { receiverId: a }] },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      messages = [];
    }
  } else {
    messages = await prisma.message.findMany({
      where: { channelId: conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
  return res.json({ data: messages });
});

// create a message (persist + broadcast)
router.post('/', requireAuth, async (req: any, res) => {
  try {
    // support multiple client payload shapes:
    // 1) { conversationId, content, receiverId }
    // 2) { message: { conversationId, content, receiverId } }
    // defensive body handling
    console.debug('messages POST received body type:', typeof req.body);
    console.debug('messages POST body value:', req.body);

    let body: any = {};
    if (req.body && typeof req.body === 'object') {
      if (Object.prototype.hasOwnProperty.call(req.body, 'message') && req.body.message && typeof req.body.message === 'object') {
        body = req.body.message;
      } else {
        body = req.body;
      }
    }

    const conversationId = body?.conversationId;
    const content = body?.content;
    const receiverId = body?.receiverId;

    if (!conversationId || !content) {
      console.warn('Invalid message payload', { body: req.body });
      return res.status(400).json({ message: 'conversationId and content are required' });
    }

    const senderId = req.user?.userId;

    // derive channelId for direct messages if not provided
    let finalChannelId = conversationId;
    if (!finalChannelId && receiverId) {
      const pair = [senderId, receiverId].sort().join(':');
      finalChannelId = `dm:${pair}`;
    }

    const saved = await prisma.message.create({
      data: {
        channelId: finalChannelId,
        content,
        senderId,
        receiverId,
        replyToId: body?.replyToId || null,
      },
    });

    const io = getIo();
    if (io) {
      // broadcast to the actual saved channel (finalChannelId)
      if (finalChannelId) io.to(`channel:${finalChannelId}`).emit('message', saved);
      if (receiverId) io.to(`user:${receiverId}`).emit('message', saved);
    }

    return res.json({ data: saved });
  } catch (err) {
    console.error('messages POST error', err, { body: req.body });
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// reply to a message (shorthand)
router.post('/:id/reply', requireAuth, async (req: any, res) => {
  try {
    const originalId = req.params.id;
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ message: 'content required' });
    const senderId = req.user?.userId;

    // find original message to copy channelId/receiverId
    const orig = await prisma.message.findUnique({ where: { id: originalId } });
    if (!orig) return res.status(404).json({ message: 'original message not found' });

    const saved = await prisma.message.create({
      data: {
        channelId: orig.channelId || `dm:${[orig.senderId, orig.receiverId].filter(Boolean).sort().join(':')}`,
        content,
        senderId,
        receiverId: orig.receiverId || null,
        replyToId: originalId,
      },
    });

    const io = getIo();
    if (io) {
      const room = saved.channelId ? `channel:${saved.channelId}` : `user:${saved.receiverId}`;
      io.to(room).emit('message', saved);
      if (saved.receiverId) io.to(`user:${saved.receiverId}`).emit('message', saved);
    }

    return res.json({ data: saved });
  } catch (err) {
    console.error('reply error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// update message (only sender)
router.patch('/:id', requireAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    const { content } = req.body || {};
    if (typeof content !== 'string') return res.status(400).json({ message: 'content required' });
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ message: 'not found' });
    if (msg.senderId !== req.user.userId) return res.status(403).json({ message: 'forbidden' });

    const updated = await prisma.message.update({ where: { id }, data: { content } });
    const io = getIo();
    if (io) {
      const room = updated.channelId ? `channel:${updated.channelId}` : `user:${updated.receiverId}`;
      io.to(room).emit('message:update', updated);
      if (updated.receiverId) io.to(`user:${updated.receiverId}`).emit('message:update', updated);
    }
    return res.json({ data: updated });
  } catch (err) {
    console.error('patch message error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// delete message (only sender)
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const id = req.params.id;
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ message: 'not found' });
    if (msg.senderId !== req.user.userId) return res.status(403).json({ message: 'forbidden' });

    await prisma.message.delete({ where: { id } });
    const io = getIo();
    if (io) {
      const room = msg.channelId ? `channel:${msg.channelId}` : `user:${msg.receiverId}`;
      io.to(room).emit('message:delete', { id });
      if (msg.receiverId) io.to(`user:${msg.receiverId}`).emit('message:delete', { id });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('delete message error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as messagesRouter };
