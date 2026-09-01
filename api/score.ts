// Vercel Serverless Function - Bobby Score API
// Endpoint: /api/score
// Usa Vercel KV para persistência dos records

import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ScoreEntry {
  name: string;
  score: number;
  flawless: boolean;
  date: string;
}

const SCORE_KEY = 'bobby-board';

// Busca o scoreboard do KV
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
    try {
      const boardJson = await kv.get(SCORE_KEY);
      const board: ScoreEntry[] = boardJson ? JSON.parse(boardJson) : [];
      return res.status(200).json(board.slice(0, 10));
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ error: 'Failed to fetch scores' });
    }
  }

  // POST - Save new score
  if (req.method === 'POST') {
    const { name = '', score = 0, flawless = false } = req.body;

    try {
      // Busca o board atual
      const boardJson = await kv.get(SCORE_KEY);
      const board: ScoreEntry[] = boardJson ? JSON.parse(boardJson) : [];

      // Adiciona novo score
      const newEntry: ScoreEntry = {
        name: (name || 'ANÔNIMO').slice(0, 12).toUpperCase(),
        score: Math.floor(score) || 0,
        flawless: !!flawless,
        date: new Date().toLocaleDateString('pt-BR'),
      };

      board.push(newEntry);
      board.sort((a, b) => b.score - a.score);
      const newBoard = board.slice(0, 10);

      // Salva no KV
      await kv.set(SCORE_KEY, JSON.stringify(newBoard));

      return res.status(200).json(newBoard);
    } catch (error) {
      console.error('POST error:', error);
      return res.status(500).json({ error: 'Failed to save score' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
