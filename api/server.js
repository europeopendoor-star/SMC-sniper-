import express from 'express';
import multer from 'multer';
import axios from 'axios';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import FormData from 'form-data';
import fs from 'fs';
import { Engine } from 'engine';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const smcEngine = new Engine();
const VISION_URL = process.env.VISION_URL || 'http://localhost:8000';

let clients = [];

wss.on('connection', (ws) => {
    clients.push(ws);
    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
    });

    // Send initial state
    ws.send(JSON.stringify({ type: 'STATE_UPDATE', payload: smcEngine.getState() }));
});

function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify(message));
        }
    });
}

function handleAlert(alert) {
    console.log("ALERT TRIGGERED:", alert);
    broadcast({ type: 'ALERT', payload: alert });
}

// Upload screenshot endpoint
app.post('/api/upload', upload.single('screenshot'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Forward to vision service
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const visionRes = await axios.post(`${VISION_URL}/analyze`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const visionData = visionRes.data;
        console.log("Received data from vision service:", visionData);

        // Import zones to SMC Engine
        smcEngine.importVisionData(visionData);

        // Notify frontend
        broadcast({ type: 'STATE_UPDATE', payload: smcEngine.getState() });

        res.json({ message: 'Upload processed', data: visionData });
    } catch (error) {
        console.error("Error processing upload:", error.message);
        res.status(500).json({ error: 'Failed to process image.' });
    } finally {
        if (req.file) {
            fs.unlinkSync(req.file.path); // cleanup
        }
    }
});

// Mock feed endpoint to test engine logic
app.post('/api/feed', (req, res) => {
    const { candle } = req.body;
    if (!candle) {
        return res.status(400).send('Candle data missing');
    }

    // Process candle
    smcEngine.tick(candle, handleAlert);

    // Broadcast candle and updated state
    broadcast({ type: 'CANDLE', payload: candle });
    broadcast({ type: 'STATE_UPDATE', payload: smcEngine.getState() });

    res.json({ message: 'Candle processed' });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
});
