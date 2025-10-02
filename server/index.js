// server/index.js

// Import required packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const axios = require('axios'); // For making HTTP requests to ElevenLabs

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware setup
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the Sentio backend!' });
});

// Chat endpoint (no changes here)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, history } = req.body;
    const systemPrompts = {
        'Job': "You are a professional, friendly hiring manager for a tech company. Keep your questions relevant to a job interview and your responses concise.",
        'School': "You are a university admissions officer. You are formal and inquisitive. Ask questions relevant to a prospective student's academic and personal background.",
        'Casual': "You are a friendly acquaintance. Keep the conversation light, engaging, and informal."
    };
    const systemMessage = { role: "system", content: systemPrompts[mode] || systemPrompts['Casual'] };
    const messages = [systemMessage, ...history, { role: "user", content: message }];
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    });
    const aiResponse = completion.choices[0].message.content;
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error communicating with OpenAI:', error.message);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
});

// NEW: Text-to-Speech endpoint
app.post('/api/tts', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'No text provided.' });
        }

        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        // This is a popular voice ID from ElevenLabs. You can choose others from their site.
        const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; 

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY,
                },
                responseType: 'stream', // Important to handle the audio stream
            }
        );

        // Pipe the audio stream from ElevenLabs directly to the client
        res.setHeader('Content-Type', 'audio/mpeg');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error with ElevenLabs API:', error.message);
        res.status(500).json({ error: 'Failed to generate speech.' });
    }
});


// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

