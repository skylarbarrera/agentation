import { createContext } from 'react';

export interface AgenationContextValue {
  reportScrollOffset: (x: number, y: number) => void;
  scrollOffset: { x: number; y: number };
  isAnnotationMode: boolean;
}

export const AgenationContext = createContext<AgenationContextValue | null>(null);
