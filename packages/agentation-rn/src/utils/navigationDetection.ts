/**
 * Navigation Detection
 * Pluggable system for detecting current route from various navigation libraries
 */

export interface NavigationInfo {
  routeName?: string;
  routeParams?: Record<string, unknown>;
  navigationPath?: string;
}

export type NavigationResolver = () => NavigationInfo | undefined;

/**
 * React Navigation resolver
 * Looks for __REACT_NAVIGATION_DEVTOOLS__ global
 */
export const reactNavigationResolver: NavigationResolver = () => {
  try {
    const globalNav = (global as any).__REACT_NAVIGATION_DEVTOOLS__;
    if (globalNav?.navigatorRef?.current) {
      const state = globalNav.navigatorRef.current.getRootState?.();
      if (state) {
        const route = getActiveRoute(state);
        if (route) {
          return {
            routeName: route.name,
            routeParams: route.params as Record<string, unknown> | undefined,
            navigationPath: buildNavigationPath(state),
          };
        }
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Expo Router resolver
 * Looks for expo-router's navigation state
 */
export const expoRouterResolver: NavigationResolver = () => {
  try {
    // Expo Router exposes state via __expo_router_store__
    const expoStore = (global as any).__expo_router_store__;
    if (expoStore) {
      const state = expoStore.getState?.();
      if (state?.routes) {
        const route = getActiveRoute(state);
        if (route) {
          return {
            routeName: route.name,
            routeParams: route.params as Record<string, unknown> | undefined,
            navigationPath: buildNavigationPath(state),
          };
        }
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
};

/**
 * Default resolvers tried in order
 */
const defaultResolvers: NavigationResolver[] = [
  reactNavigationResolver,
  expoRouterResolver,
];

/**
 * Try to get navigation info using available resolvers
 */
export function getNavigationInfo(
  customResolver?: NavigationResolver
): NavigationInfo | undefined {
  // Try custom resolver first if provided
  if (customResolver) {
    const result = customResolver();
    if (result) return result;
  }

  // Fall back to default resolvers
  for (const resolver of defaultResolvers) {
    const result = resolver();
    if (result) return result;
  }

  return undefined;
}

// Helper functions
function getActiveRoute(state: any): { name: string; params?: unknown } | undefined {
  if (!state || !state.routes) return undefined;
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRoute(route.state);
  }
  return route;
}

function buildNavigationPath(state: any): string {
  const parts: string[] = [];
  let current = state;
  while (current && current.routes) {
    const route = current.routes[current.index];
    parts.push(route.name);
    current = route.state;
  }
  return parts.join('/');
}
