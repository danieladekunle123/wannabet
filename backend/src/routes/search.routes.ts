import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /search?q=term
router.get('/', async (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (!q) return res.json({ data: { users: [], matches: [], games: [] } });

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { profile: { displayName: { contains: q, mode: 'insensitive' } } }
        ]
      },
      select: { id: true, username: true, avatarUrl: true, profile: { select: { displayName: true } } },
      take: 20
    });

    const matches = await prisma.match.findMany({
      where: { game: { contains: q, mode: 'insensitive' } },
      select: { id: true, game: true, stake: true, status: true },
      take: 20
    });

    const games = await prisma.playerGame.findMany({
      where: { game: { contains: q, mode: 'insensitive' } },
      select: { game: true },
      distinct: ['game'],
      take: 20
    });

    return res.json({ data: { users, matches, games } });
  } catch (err) {
    console.error('search error', err);
    return res.status(500).json({ message: 'search failed' });
  }
});

export { router as searchRouter };
