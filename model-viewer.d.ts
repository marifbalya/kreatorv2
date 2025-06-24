// Ensure React types are available. Using import type for safety.
import type React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * Defines the 'model-viewer' custom element for JSX.
       * Uses React.DetailedHTMLProps for standard HTML and React attributes.
       * Intersects with specific attributes for model-viewer.
       */
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { // Base HTML attributes
          src?: string;
          alt?: string;
          'camera-controls'?: boolean;
          'auto-rotate'?: boolean;
          ar?: boolean;
          'ios-src'?: string;
          poster?: string;
          // Add other specific model-viewer attributes if used:
          // 'skybox-image'?: string;
          // 'environment-image'?: string;
          // 'exposure'?: number;
          // 'shadow-intensity'?: number;
          // 'ar-modes'?: string;
          // 'ar-scale'?: string;
          // 'loading'?: 'auto' | 'lazy' | 'eager';
          // 'reveal'?: 'auto' | 'manual' | 'interaction';
          // 'camera-orbit'?: string;
          // 'min-camera-orbit'?: string;
          // 'max-camera-orbit'?: string;
          // 'field-of-view'?: string;
          // 'animation-name'?: string;
          // 'autoplay'?: boolean;
          // ... and so on for any other attributes you might use
        },
        HTMLElement // The underlying HTML element type
      >;
    }
  }
}

// This export statement is crucial for TypeScript to treat this file as a module
// and apply the global augmentations.
export {};
