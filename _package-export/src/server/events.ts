/**
 * EventBus for real-time event distribution.
 * Coordinates SSE streams, MCP notifications, and future webhooks.
 */

import type { SAFEvent, SAFEventType, Annotation, Session, ThreadMessage } from "../types.js";

type EventHandler = (event: SAFEvent) => void;

// Global sequence counter for event ordering
let globalSequence = 0;

/**
 * Simple pub/sub event bus for SAF events.
 */
class EventBus {
  private handlers = new Set<EventHandler>();
  private sessionHandlers = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to all events.
   */
  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Subscribe to events for a specific session.
   */
  subscribeToSession(sessionId: string, handler: EventHandler): () => void {
    if (!this.sessionHandlers.has(sessionId)) {
      this.sessionHandlers.set(sessionId, new Set());
    }
    this.sessionHandlers.get(sessionId)!.add(handler);

    return () => {
      const handlers = this.sessionHandlers.get(sessionId);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.sessionHandlers.delete(sessionId);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers.
   */
  emit(
    type: SAFEventType,
    sessionId: string,
    payload: Annotation | Session | ThreadMessage
  ): SAFEvent {
    const event: SAFEvent = {
      type,
      timestamp: new Date().toISOString(),
      sessionId,
      sequence: ++globalSequence,
      payload,
    };

    // Notify global subscribers
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (err) {
        console.error("[EventBus] Handler error:", err);
      }
    }

    // Notify session-specific subscribers
    const sessionHandlers = this.sessionHandlers.get(sessionId);
    if (sessionHandlers) {
      for (const handler of sessionHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error("[EventBus] Session handler error:", err);
        }
      }
    }

    return event;
  }

  /**
   * Get current sequence number (for reconnect logic).
   */
  getSequence(): number {
    return globalSequence;
  }

  /**
   * Set sequence from persisted state (for server restart).
   */
  setSequence(seq: number): void {
    globalSequence = seq;
  }
}

// Singleton instance
export const eventBus = new EventBus();
