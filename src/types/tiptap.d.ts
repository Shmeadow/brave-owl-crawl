import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    important: {
      /**
       * Toggle the important mark with optional color attribute
       */
      toggleImportant: (attributes?: { color: string }) => ReturnType;
      /**
       * Remove the important mark
       */
      unsetImportant: () => ReturnType;
    };
    callout: {
      /**
       * Toggle a callout block
       */
      toggleCallout: (attributes?: { type: string }) => ReturnType;
    };
  }
}