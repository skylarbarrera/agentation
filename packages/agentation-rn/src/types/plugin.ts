/**
 * Agentation Plugin Interface
 *
 * Plugins allow extending Agentation with optional integrations
 * without adding dependencies to the core package.
 */

/**
 * Context passed to plugin getExtras
 */
export interface PluginContext {
  /** Target file path from annotation (if available) */
  targetFile?: string;
  /** Target line number from annotation (if available) */
  targetLine?: number;
  /** Current screen/route name */
  screenName?: string;
  /** Component name from annotation (e.g., "PulsingCircle") */
  componentName?: string;
  /** Parent component hierarchy (e.g., ["AnimationScreen", "PulsingCircle"]) */
  parentComponents?: string[];
}

/**
 * Extra data returned by plugins to append to markdown output
 */
export interface PluginExtra {
  /** Unique identifier for this extra (e.g., "reanimated") */
  id: string;
  /** Markdown content to append to output */
  markdown: string;
}

/**
 * Plugin interface for Agentation
 *
 * @example
 * ```ts
 * import { reanimatedPausePlugin } from 'agentation-reanimated-pause-state';
 *
 * <Agentation plugins={[reanimatedPausePlugin()]}>
 *   <App />
 * </Agentation>
 * ```
 */
export interface AgentationPlugin {
  /**
   * Unique identifier for this plugin
   */
  id: string;

  /**
   * Whether this plugin supports pause/resume
   * If true, the toolbar will show a pause/play button
   */
  supportsPause?: boolean;

  /**
   * Called when user toggles pause state via the toolbar button
   *
   * @param paused - true to pause, false to resume
   */
  onPauseChange?: (paused: boolean) => void;

  /**
   * Check if the plugin is currently active/installed
   * Return false if dependencies aren't available
   */
  isAvailable?: () => boolean;

  /**
   * Called when generating markdown output (before copy)
   *
   * Return extra markdown to append to the output.
   * This is useful for including state snapshots, debug info, etc.
   *
   * @param ctx - Context about the current annotation
   * @returns Extra data to append, or null to skip
   */
  getExtras?: (ctx: PluginContext) => PluginExtra | null;
}
