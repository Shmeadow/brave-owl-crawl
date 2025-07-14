import { Mark, mergeAttributes } from '@tiptap/core';
import type { ChainedCommands, HTMLAttributes } from '@tiptap/core';

export const Important = Mark.create({
  name: 'important',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'important-journal-item',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.important-journal-item',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleImportant: () => ({ commands }: { commands: ChainedCommands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});