import { generateMarkdown } from '../../utils/markdownGeneration';
import type { Annotation } from '../../types';

const annotation: Annotation = {
  id: '1', x: 50.5, y: 200, comment: 'Button contrast too low',
  element: 'LoginButton', elementPath: 'src/screens/Login.tsx:42',
  timestamp: 1000, componentType: 'TouchableOpacity',
  selectedText: 'Log In', reactComponents: '<App><Auth><LoginButton>',
  boundingBox: { x: 100, y: 200, width: 120, height: 40 },
  nearbyText: 'Enter your credentials',
  platform: 'ios', screenDimensions: { width: 390, height: 844 },
};

describe('Markdown format parity with web', () => {
  test('compact output', () => {
    const out = generateMarkdown([annotation], 'LoginScreen', 'compact').content;
    console.log('\n=== COMPACT ===\n' + out);
    expect(out).toContain('## Page Feedback: LoginScreen');
    expect(out).toContain('1. **LoginButton**: Button contrast too low');
    expect(out).toContain('(re: "Log In")');
  });
  test('standard output', () => {
    const out = generateMarkdown([annotation], 'LoginScreen', 'standard').content;
    console.log('\n=== STANDARD ===\n' + out);
    expect(out).toContain('## Page Feedback: LoginScreen');
    expect(out).toContain('**Viewport:**');
    expect(out).toContain('### 1. LoginButton');
    expect(out).toContain('**Location:** src/screens/Login.tsx:42');
    expect(out).toContain('**React:**');
    expect(out).toContain('**Feedback:** Button contrast too low');
  });
  test('forensic output', () => {
    const out = generateMarkdown([annotation], 'LoginScreen', 'forensic').content;
    console.log('\n=== FORENSIC ===\n' + out);
    expect(out).toContain('**Environment:**');
    expect(out).toContain('**Annotation at:**');
    expect(out).toContain('from left');
  });
});
