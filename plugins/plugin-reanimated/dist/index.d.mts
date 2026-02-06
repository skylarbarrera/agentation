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
interface AgentationPlugin {
    id: string;
    supportsPause?: boolean;
    onPauseChange?: (paused: boolean) => void;
    isAvailable?: () => boolean;
    getExtras?: (ctx: PluginContext) => PluginExtra | null;
}
interface PluginContext {
    targetFile?: string;
    targetLine?: number;
    screenName?: string;
    componentName?: string;
    parentComponents?: string[];
}
interface PluginExtra {
    id: string;
    markdown: string;
}
/**
 * Check if reanimated-pause-state is installed and available
 */
declare function isReanimatedPauseStateAvailable(): boolean;
/**
 * Create the Reanimated pause state plugin for Agentation
 *
 * This plugin:
 * - Adds a pause/play button to the Agentation toolbar
 * - Captures animation state when copying annotations
 *
 * @returns AgentationPlugin instance
 */
declare function reanimatedPausePlugin(): AgentationPlugin;

export { type AgentationPlugin, type PluginContext, type PluginExtra, reanimatedPausePlugin as default, isReanimatedPauseStateAvailable, reanimatedPausePlugin };
