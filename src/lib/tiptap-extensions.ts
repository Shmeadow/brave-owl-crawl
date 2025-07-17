import { Mark, mergeAttributes, Node } from '@tiptap/core';
import type { ChainedCommands, Attributes } from '@tiptap/core';
import { Lightbulb } from 'lucide-react'; // Import an icon for the callout

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

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      type: {
        default: 'info', // 'info', 'warning', 'success', 'danger'
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.prose-callout',
        getAttrs: node => {
          if (node instanceof HTMLElement) {
            return { type: node.dataset.type };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'prose-callout', 'data-type': HTMLAttributes.type }), 0];
  },

  addCommands() {
    return {
      toggleCallout: (attributes) => ({ commands }) => {
        return commands.toggleWrap(this.name, attributes);
      },
    };
  },
});