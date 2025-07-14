import { Mark, mergeAttributes } from '@tiptap/core';
import type { ChainedCommands, Attributes } from '@tiptap/core';

export const Important = Mark.create({
  name: 'important',

  addAttributes() {
    return {
      color: {
        default: '#fbbf24', // Default to yellow
        parseHTML: element => element.getAttribute('data-color'),
        renderHTML: attributes => {
          if (!attributes.color) {
            return {};
          }
          return {
            'data-color': attributes.color,
          };
        },
      },
    };
  },

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
        getAttrs: node => {
          if (node instanceof HTMLElement) {
            return { color: node.dataset.color };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Attributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleImportant: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetImportant: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});