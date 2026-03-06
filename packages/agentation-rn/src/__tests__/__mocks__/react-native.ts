// Minimal react-native mock for unit tests (no rendering needed)
module.exports = {
  Platform: { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default },
  StyleSheet: { create: (s: any) => s, absoluteFillObject: {} },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Linking: { openURL: jest.fn() },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  PixelRatio: { get: () => 3 },
  Animated: {
    Value: class { constructor(v: number) {} interpolate() {} },
    View: 'View',
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    parallel: jest.fn(() => ({ start: jest.fn() })),
    sequence: jest.fn(() => ({ start: jest.fn() })),
  },
  useColorScheme: () => 'dark',
  Pressable: 'Pressable',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  Modal: 'Modal',
};
