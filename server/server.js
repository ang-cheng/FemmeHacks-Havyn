import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.send('Havyn backend is running');
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/debug/env', (req, res) => {
  res.json({
    hasApiKey: Boolean(process.env.ELEVENLABS_API_KEY),
  });
});

app.post('/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text' });
    }

    if (!voiceId || typeof voiceId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid voiceId' });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(500).json({
        error: 'Missing ELEVENLABS_API_KEY in server .env',
      });
    }

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
        }),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      return res.status(elevenRes.status).json({
        error: 'ElevenLabs request failed',
        details: errText,
      });
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    return res.send(audioBuffer);
  } catch (error) {
    console.error('TTS route error:', error);
    return res.status(500).json({
      error: 'Internal server error while generating speech',
    });
  }
});

app.get('/tts-preview', async (req, res) => {
  try {
    const { text, voiceId } = req.query;

    if (!text || typeof text !== 'string') {
      return res.status(400).send('Missing text');
    }

    if (!voiceId || typeof voiceId !== 'string') {
      return res.status(400).send('Missing voiceId');
    }

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
        }),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      return res.status(elevenRes.status).send(errText);
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});