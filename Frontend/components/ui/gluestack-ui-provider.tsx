import React from 'react';
import * as providerModule from '@gluestack-ui/provider';
import * as themedModule from '@gluestack-ui/themed';

// Default fallback provider (named for lint/display-name)
export const FallbackGluestackUIProvider: React.FC<React.PropsWithChildren<any>> = ({ children }) => <>{children}</>;

let GluestackUIProvider: React.ComponentType<any> = FallbackGluestackUIProvider;

// Try to detect createProvider and styled provider exports at runtime.
if (providerModule && typeof (providerModule as any).createProvider === 'function') {
  const createProvider = (providerModule as any).createProvider;
  const StyledProvider = (themedModule as any).Provider || (themedModule as any).ThemeProvider || (themedModule as any).default || null;
  if (StyledProvider) {
    GluestackUIProvider = createProvider({ StyledProvider });
  } else {
    GluestackUIProvider = FallbackGluestackUIProvider;
  }
}

export { GluestackUIProvider };
export default GluestackUIProvider;
