// This file is used to declare global types that might not be automatically inferred
// or are specific to environments like Deno, but needed for local TypeScript compilation.

declare global {
  namespace Deno {
    namespace env {
      function get(key: string): string | undefined;
    }
  }
}

// Ensure this file is included in your tsconfig.json's 'include' array if not already.
// For example: "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "src/types/global.d.ts"]