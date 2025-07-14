import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    important: {
      /**
       * Toggle the important mark
       */
      toggleImportant: () => ReturnType;
    };
  }
}