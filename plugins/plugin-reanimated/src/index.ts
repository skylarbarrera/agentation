/**
 * Agentation Reanimated Pause State Plugin
 *
 * Integrates reanimated-pause-state with Agentation for pausing
 * Reanimated animations and capturing animation state in output.
 *
 * @example
 * ```tsx
 * import { Agentation } from 'agentation-rn';
 * import { reanimatedPausePlugin } from 'agentation-reanimated-pause-state';
 *
 * export function App() {
 *   return (
 *     <Agentation plugins={[reanimatedPausePlugin()]}>
 *       <Root />
 *     </Agentation>
 *   );
 * }
 * ```
 */

/**
 * Plugin interface (matches agentation-rn's AgentationPlugin)
 */
export interface AgentationPlugin {
  id: string;
  supportsPause?: boolean;
  onPauseChange?: (paused: boolean) => void;
  isAvailable?: () => boolean;
  getExtras?: (ctx: PluginContext) => PluginExtra | null;
}

export interface PluginContext {
  targetFile?: string;
  targetLine?: number;
  screenName?: string;
  componentName?: string;
  parentComponents?: string[];
}

export interface PluginExtra {
  id: string;
  markdown: string;
}

// Type for reanimated-pause-state
interface SnapshotOptions {
  filterFile?: string;
  filterLine?: number;
  proximityThreshold?: number;
  maxAnimations?: number;
  filterComponent?: string;
}

interface ReanimatedPauseState {
  isInstalled: () => boolean;
  isPaused: () => boolean;
  pause: () => unknown;
  resume: () => void;
  getSnapshotMarkdown: (opts?: SnapshotOptions) => string;
  snapshotNow: (opts?: SnapshotOptions) => unknown;
}

// Dynamically import reanimated-pause-state to avoid hard dependency
let RPS: ReanimatedPauseState | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RPS = require('reanimated-pause-state') as ReanimatedPauseState;
} catch {
  // reanimated-pause-state not installed - plugin will be unavailable
}

/**
 * Check if reanimated-pause-state is installed and available
 */
export function isReanimatedPauseStateAvailable(): boolean {
  return RPS !== null && typeof RPS.isInstalled === 'function' && RPS.isInstalled();
}

/**
 * Create the Reanimated pause state plugin for Agentation
 *
 * This plugin:
 * - Adds a pause/play button to the Agentation toolbar
 * - Captures animation state when copying annotations
 *
 * @returns AgentationPlugin instance
 */
export function reanimatedPausePlugin(): AgentationPlugin {
  return {
    id: 'reanimated-pause-state',
    supportsPause: true,

    isAvailable(): boolean {
      return true;
    },

    onPauseChange(paused: boolean): void {
      if (!RPS) return;

      try {
        if (paused) {
          RPS.pause();
        } else {
          RPS.resume();
        }
      } catch (e) {
        console.warn('[agentation-rps] pause/resume failed:', e);
      }
    },

    getExtras(ctx: PluginContext): PluginExtra | null {
      if (!RPS) return null;

      try {
        // Build filter options from context
        const opts: SnapshotOptions = {
          maxAnimations: 20,
        };

        // Primary filter: component name (most accurate)
        // Use the immediate parent component - likely where the animation is defined
        if (ctx.parentComponents?.length) {
          opts.filterComponent = ctx.parentComponents[ctx.parentComponents.length - 1];
        }

        // Fallback filter: file and line (if no component match)
        if (ctx.targetFile) {
          opts.filterFile = ctx.targetFile;
        }
        if (ctx.targetLine) {
          opts.filterLine = ctx.targetLine;
          opts.proximityThreshold = 20;
        }

        // Get markdown-formatted snapshot
        const markdown = RPS.getSnapshotMarkdown(opts);

        // Skip if no animations captured
        if (!markdown || markdown.toLowerCase().includes('no active animations') || markdown.toLowerCase().includes('no animations')) {
          return null;
        }

        return {
          id: 'reanimated',
          markdown,
        };
      } catch (e) {
        console.warn('[agentation-rps] getExtras failed:', e);
        return null;
      }
    },
  };
}

// Default export for convenience
export default reanimatedPausePlugin;
