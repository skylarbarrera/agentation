import Database from 'better-sqlite3';
import { Express } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * MCP Server Types
 * Shared types between MCP server and clients
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/mcp/src/types.ts
 */
type AnnotationIntent = 'fix' | 'change' | 'question' | 'approve';
type AnnotationSeverity = 'blocking' | 'important' | 'suggestion';
type AnnotationStatus = 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
type ThreadMessage = {
    id: string;
    role: 'human' | 'agent';
    content: string;
    timestamp: number;
};
type Annotation = {
    id: string;
    x: number;
    y: number;
    comment: string;
    element: string;
    elementPath: string;
    timestamp: number;
    selectedText?: string;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    nearbyText?: string;
    cssClasses?: string;
    nearbyElements?: string;
    computedStyles?: string;
    fullPath?: string;
    accessibility?: string;
    isMultiSelect?: boolean;
    isFixed?: boolean;
    reactComponents?: string;
    elementBoundingBoxes?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    sessionId?: string;
    url?: string;
    intent?: AnnotationIntent;
    severity?: AnnotationSeverity;
    status?: AnnotationStatus;
    thread?: ThreadMessage[];
    createdAt?: string;
    updatedAt?: string;
    resolvedAt?: string;
    resolvedBy?: 'human' | 'agent';
    authorId?: string;
    routeName?: string;
    componentType?: string;
    sourcePath?: string;
    lineNumber?: number;
    columnNumber?: number;
    testID?: string;
    platform?: 'ios' | 'android';
    _syncedTo?: string;
};
type SessionStatus = 'active' | 'approved' | 'closed';
type Session = {
    id: string;
    url: string;
    status: SessionStatus;
    createdAt: string;
    updatedAt?: string;
    projectId?: string;
    metadata?: Record<string, unknown>;
};
type SessionWithAnnotations = Session & {
    annotations: Annotation[];
};
type ActionRequest = {
    sessionId: string;
    annotations: Annotation[];
    output: string;
    timestamp: string;
};
type ActionResponse = {
    success: boolean;
    message?: string;
    actionId?: string;
};
type HealthCheckResponse = {
    status: 'ok';
    version: string;
};
type ServerConfig = {
    port: number;
    dbPath: string;
    webhookUrls?: string[];
};
declare const DEFAULT_CONFIG: ServerConfig;

/**
 * SQLite Storage for MCP Server
 * Persists sessions and annotations to disk
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/mcp/src/server/sqlite.ts
 */

declare function createDatabase(dbPath: string): Database.Database;

/**
 * HTTP Server for MCP
 * Provides REST API for React Native app communication
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/mcp/src/server/http.ts
 */

declare function createHttpServer(db: Database.Database, webhookUrls?: string[]): Express;
declare function startHttpServer(app: Express, port: number): Promise<void>;

/**
 * MCP Server Implementation
 * Provides tools for Claude Code to interact with annotations
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/mcp/src/server/mcp.ts
 */

declare function createMcpServer(db: Database.Database): Server;
declare function startMcpServer(server: Server): Promise<void>;

/**
 * Utility functions for MCP server
 */
/**
 * Generate a unique ID
 */
declare function generateId(): string;
/**
 * Parse webhook URLs from comma-separated string
 */
declare function parseWebhookUrls(urlString?: string): string[];

export { type ActionRequest, type ActionResponse, type Annotation, type AnnotationIntent, type AnnotationSeverity, type AnnotationStatus, DEFAULT_CONFIG, type HealthCheckResponse, type ServerConfig, type Session, type SessionStatus, type SessionWithAnnotations, type ThreadMessage, createDatabase, createHttpServer, createMcpServer, generateId, parseWebhookUrls, startHttpServer, startMcpServer };
