/**
 * Webhook Support
 * Fires webhooks on annotation events
 *
 * @see https://github.com/benjitaylor/agentation/blob/main/mcp/src/server/http.ts
 */

import type {
  Annotation,
  WebhookEventType,
  WebhookPayload,
  Session,
} from '../types';
import { debugLog, debugError } from './debug';

// =============================================================================
// Webhook Utility
// =============================================================================

/**
 * Fire a webhook to the specified URL(s)
 * Fire-and-forget - doesn't wait for response
 *
 * @param url - Webhook URL (can be comma-separated for multiple)
 * @param payload - Webhook payload
 */
export async function fireWebhook(
  url: string | undefined,
  payload: WebhookPayload
): Promise<void> {
  if (!url) return;

  const urls = url.split(',').map((u) => u.trim()).filter(Boolean);

  for (const webhookUrl of urls) {
    try {
      debugLog('Firing webhook:', webhookUrl, payload.event);

      // Fire-and-forget - don't await
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch((error) => {
        debugError('Webhook failed:', webhookUrl, error);
      });
    } catch (error) {
      debugError('Webhook error:', webhookUrl, error);
    }
  }
}

// =============================================================================
// Event-Specific Webhook Helpers
// =============================================================================

/**
 * Fire annotation.created webhook
 */
export function fireAnnotationCreated(
  webhookUrl: string | undefined,
  sessionId: string | undefined,
  annotation: Annotation
): void {
  fireWebhook(webhookUrl, {
    event: 'annotation.created',
    timestamp: new Date().toISOString(),
    data: {
      sessionId,
      annotation,
    },
  });
}

/**
 * Fire annotation.updated webhook
 */
export function fireAnnotationUpdated(
  webhookUrl: string | undefined,
  annotation: Annotation
): void {
  fireWebhook(webhookUrl, {
    event: 'annotation.updated',
    timestamp: new Date().toISOString(),
    data: {
      annotation,
    },
  });
}

/**
 * Fire annotation.deleted webhook
 */
export function fireAnnotationDeleted(
  webhookUrl: string | undefined,
  annotation: Annotation
): void {
  fireWebhook(webhookUrl, {
    event: 'annotation.deleted',
    timestamp: new Date().toISOString(),
    data: {
      annotation,
    },
  });
}

/**
 * Fire session.updated webhook
 */
export function fireSessionUpdated(
  webhookUrl: string | undefined,
  session: Session
): void {
  fireWebhook(webhookUrl, {
    event: 'session.updated',
    timestamp: new Date().toISOString(),
    data: {
      session,
    },
  });
}

/**
 * Fire action.requested webhook (for "Send to Agent")
 */
export function fireActionRequested(
  webhookUrl: string | undefined,
  sessionId: string,
  annotations: Annotation[],
  output: string
): void {
  fireWebhook(webhookUrl, {
    event: 'action.requested',
    timestamp: new Date().toISOString(),
    data: {
      sessionId,
      annotations,
      output,
    },
  });
}
