import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { addItemRequestValidator, formatAjvValidationErrors, getLoginRequestValidator, updateItemRequestValidator } from './schema'
import { createHash } from 'crypto';
import { getUserByCredentials, getUserById } from './users';
import { createAuthToken, validateAuthToken } from './auth';
import { InvalidAuthTokenError } from './errors';
import { addEntryToList, getEntriesByUserId, updateEntryCompletion } from './entries';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const app = express();
const port = 3000;

const wsPort = 8080;
const wss = new WebSocketServer({port: wsPort});

const main = async () => {
    await initializeServer();
    await initializeWebSocketServer();
};

const initializeServer = async () => {
    console.log('EX: Initializing Express Server...');
    app.use(express.json());

    console.log('EX: Configuring CORS...');
    app.use(cors({
        origin: '*' // allows all origins to allow standalone application
    }));

    interface LoginRequestBody {
        username: string
        password: string
    }

    interface TokenPayload {
        id: number
    }

    console.log('EX: Defining endpoint POST /login');
    app.post('/login', async (req, res): Promise<any> => {
        try {
            const validator = getLoginRequestValidator();
            if (!validator(req.body)) {
                return res.status(400).json({ error: 'malformed/invalid request body', message: formatAjvValidationErrors(validator.errors) });
            }
            const body = req.body as LoginRequestBody;
            const passwordHash = createHash('sha256').update(body.password).digest('hex');
            const user = await getUserByCredentials(body.username, passwordHash);
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const authToken = createAuthToken<TokenPayload>({ id: user.id });
            return res.status(201).json({ token: authToken });
        }
        catch (err: unknown) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    console.log('EX: Defining endpoint GET /user');
    app.get('/user', async (req, res): Promise<any> => {
        try {
            if (!req.headers.token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const token = req.headers.token as string;
            const payload = validateAuthToken<TokenPayload>(token);
            const user = await getUserById(payload.id);
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            return res.status(200).json({ id: user.id, username: user.username });
        }
        catch (err: unknown) {
            if (err instanceof InvalidAuthTokenError) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            console.error(err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

    interface AddEntryBody {
        content: string
    }

    interface UpdateEntryBody {
        completed: boolean
    }

    console.log('EX: Defining endpoint GET /entry');
    app.get('/entry', async (req, res): Promise<any> => {
        try {
            if (!req.headers.token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const token = req.headers.token as string;
            const payload = validateAuthToken<TokenPayload>(token);
            const user = await getUserById(payload.id);
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const entries = await getEntriesByUserId(user.id);
            return res.status(200).json(entries);
        }
        catch (err: unknown) {
            if (err instanceof InvalidAuthTokenError) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            console.error(err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

    console.log('EX: Defining endpoint POST /entry');
    app.post('/entry', async (req, res): Promise<any> => {
        try {
            if (!req.headers.token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const token = req.headers.token as string;
            const payload = validateAuthToken<TokenPayload>(token);
            const user = await getUserById(payload.id);
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const validator = addItemRequestValidator();
            if (!validator(req.body)) {
                return res.status(400).json({ error: 'malformed/invalid request body', message: formatAjvValidationErrors(validator.errors) });
            }
            const body = req.body as AddEntryBody;
            await addEntryToList(user.id, body.content);
            updateAllSockets();
            return res.status(201).json({ message: `successfully added new entry` });
        }
        catch (err: unknown) {
            if (err instanceof InvalidAuthTokenError) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            console.error(err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

    console.log('EX: Defining endpoint POST /entry/:id');
    app.post('/entry/:id', async (req, res): Promise<any> => {
        try {
            const id = parseInt(req.params.id, 10);
            if (!req.headers.token) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const token = req.headers.token as string;
            const payload = validateAuthToken<TokenPayload>(token);
            const user = await getUserById(payload.id);
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const validator = updateItemRequestValidator();
            if (!validator(req.body)) {
                return res.status(400).json({ error: 'malformed/invalid request body', message: formatAjvValidationErrors(validator.errors) });
            }
            const body = req.body as UpdateEntryBody;
            await updateEntryCompletion(id, body.completed);
            updateAllSockets();
            return res.status(201).json({ message: `successfully updated entry ${id}` });
        }
        catch (err: unknown) {
            if (err instanceof InvalidAuthTokenError) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            console.error(err);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    });

    // start express server
    app.listen(port, () => {
        console.log(`EX: Listening on port ${port}`);
    });

    console.log('EX: Express Server Initialized!');
};

const initializeWebSocketServer = async () => {
    console.log('WS: Initializing WebSocket Server...');
    wss.on('connection', (socket) => {
        console.log('WS: Client connected.');
        socket.on('close', () => {
            console.log('WS: Client disconnected.');
        });
    });
    console.log('WS: Listening on port 8080');
};

function updateAllSockets() {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ updateRequired: true }));
        }
    });
}

main();