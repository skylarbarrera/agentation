import React, { useRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Agentation } from 'agentation-rn';
import { reanimatedPausePlugin } from '@agentation/plugin-reanimated';
import { colors, typography } from './theme';
import { EventsPanel } from './components';
import { useApiEvents } from './hooks';

import { HomeScreen, SettingsScreen, ProfileScreen, ScrollExampleScreen, ModalExampleScreen, AnimationScreen } from './screens';

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Profile: { userId: string };
  ScrollExample: undefined;
  ModalExample: undefined;
  Animation: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { events, clearEvents, callbacks } = useApiEvents();

  // Create plugins array (memoized to avoid re-renders)
  const plugins = useMemo(() => [reanimatedPausePlugin()], []);

  return (
    <SafeAreaProvider>
      <Agentation
        {...callbacks}
        plugins={plugins}
        endpoint="http://localhost:4848"
        onSessionCreated={(sessionId) => console.log('Session created:', sessionId)}
      >
        <View style={styles.container}>
          <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // Expose navigation ref for route detection
            (global as any).__REACT_NAVIGATION_DEVTOOLS__ = {
              navigatorRef: navigationRef,
            };
          }}
        >
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.light.bgCard,
              },
              headerTintColor: colors.light.text,
              headerTitleStyle: {
                fontWeight: typography.weights.semibold,
                fontSize: typography.sizes.title,
              },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Agentation' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen
              name="ScrollExample"
              component={ScrollExampleScreen}
              options={{ title: 'Scroll Example' }}
            />
            <Stack.Screen
              name="ModalExample"
              component={ModalExampleScreen}
              options={{ title: 'Modal Example' }}
            />
            <Stack.Screen
              name="Animation"
              component={AnimationScreen}
              options={{ title: 'Animations' }}
            />
          </Stack.Navigator>
          </NavigationContainer>
          <EventsPanel events={events} onClear={clearEvents} enabled={__DEV__} />
        </View>
      </Agentation>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.bg,
  },
});
