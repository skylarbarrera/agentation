import type { Annotation } from './annotation';
import type { CodeInfo } from './detection';

export function isAnnotation(obj: unknown): obj is Annotation {
  if (!obj || typeof obj !== 'object') return false;
  const ann = obj as Partial<Annotation>;
  return (
    typeof ann.id === 'string' &&
    typeof ann.x === 'number' &&
    typeof ann.y === 'number' &&
    typeof ann.comment === 'string' &&
    typeof ann.element === 'string' &&
    typeof ann.elementPath === 'string' &&
    typeof ann.timestamp === 'number'
  );
}

export function isValidCodeInfo(info: unknown): info is CodeInfo {
  if (!info || typeof info !== 'object') return false;
  const code = info as Partial<CodeInfo>;
  return (
    typeof code.relativePath === 'string' &&
    typeof code.lineNumber === 'number' &&
    typeof code.componentName === 'string'
  );
}
