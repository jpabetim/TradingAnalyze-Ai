// This file declares global types, particularly for custom properties
// added to the window object, like window.process.env.API_KEY.

interface Window {
  // Define the 'process' object on window, which is expected to be
  // set up by index.html for API key injection.
  process?: {
    env?: {
      API_KEY?: string;
      // Add other environment variables here if they are similarly injected
    };
  };
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Agrega aquí otras variables de entorno VITE_ si las usas
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
