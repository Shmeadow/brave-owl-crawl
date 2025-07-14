import { Mark, mergeAttributes } from '@tiptap/core';

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

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleImportant: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});