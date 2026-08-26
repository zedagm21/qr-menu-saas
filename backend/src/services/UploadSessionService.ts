import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

export interface UploadSession {
    id: string;
    token: string;
    restaurantId?: string;
    status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
    imageUrl?: string;
    createdAt: number;
    expiresAt: number;
}

class UploadSessionManager {
    private sessions: Map<string, UploadSession> = new Map();
    private readonly SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

    constructor() {
        // Periodically purge expired sessions
        setInterval(() => this.cleanupExpired(), 2 * 60 * 1000);
    }

    /**
     * Creates a new temporary camera upload companion session.
     */
    createSession(restaurantId?: string): UploadSession {
        const id = uuid();
        const token = crypto.randomBytes(16).toString('hex');
        const now = Date.now();

        const session: UploadSession = {
            id,
            token,
            restaurantId,
            status: 'PENDING',
            createdAt: now,
            expiresAt: now + this.SESSION_TTL_MS,
        };

        this.sessions.set(id, session);
        return session;
    }

    /**
     * Retrieves session ensuring it exists, token matches, and has not expired.
     */
    getSession(id: string, token: string): UploadSession | null {
        const session = this.sessions.get(id);
        if (!session) return null;

        if (session.token !== token) return null;

        if (Date.now() > session.expiresAt) {
            session.status = 'EXPIRED';
            this.sessions.delete(id);
            return null;
        }

        return session;
    }

    /**
     * Marks session as completed with the newly uploaded image URL.
     */
    completeSession(id: string, token: string, imageUrl: string): boolean {
        const session = this.getSession(id, token);
        if (!session) return false;

        session.status = 'COMPLETED';
        session.imageUrl = imageUrl;
        return true;
    }

    /**
     * Removes expired sessions from memory.
     */
    private cleanupExpired() {
        const now = Date.now();
        for (const [id, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(id);
            }
        }
    }
}

export const uploadSessionService = new UploadSessionManager();
