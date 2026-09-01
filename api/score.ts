// Vercel Serverless Function - Bobby Score API
// Deploy: vercel --prod
// Endpoint: /api/score

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ScoreEntry {
  name: string;
  score: number;
  flawless: boolean;
  date: string;
}

// In-memory storage (persists during warm starts)
function getBoard(): ScoreEntry[] {
  try {
    if (process.env.SCORE_BOARD) {
      const parsed = JSON.parse(process.env.SCORE_BOARD);
      if (Array.isArray(parsed)) {
        return parsed as ScoreEntry[];
      }
    }
  } catch { /* ignore */ }
  return [];
}

function saveBoard(board: ScoreEntry[]) {
  try {
    process.env.SCORE_BOARD = JSON.stringify(board.slice(0, 10));
  } catch { /* ignore */ }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  // GET - Return top 10 scores
  if (req.method === 'GET') {
    const board = getBoard();
    return res.status(200).json(board.slice(0, 10));
  }

  // POST - Save new score
  if (req.method === 'POST') {
    const { name = '', score = 0, flawless = false } = req.body;

    const board = getBoard();
    const newEntry: ScoreEntry = {
      name: (name || 'ANÔNIMO').slice(0, 12).toUpperCase(),
      score: Math.floor(score) || 0,
      flawless: !!flawless,
      date: new Date().toLocaleDateString('pt-BR'),
    };

    board.push(newEntry);
    board.sort((a, b) => b.score - a.score);
    saveBoard(board);

    return res.status(200).json(board.slice(0, 10));
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
