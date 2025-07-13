"use client";

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Highlight } from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { toast } from 'sonner';
import { AnnotationData } from '@/hooks/use-annotations'; // Import AnnotationData

interface RichTextEditorProps {
  content: string;
  onChange: (richText: string) => void;
  disabled?: boolean;
  noteId: string | null; // Made optional for new notes
  annotations: AnnotationData[]; // Made optional
  onAddAnnotation: (highlightId: string, highlightedText: string) => Promise<AnnotationData | null>; // Made optional
  onDeleteAnnotation: (highlightId: string) => void; // Made optional
  onUpdateAnnotationComment: (annotationId: string, comment: string) => void; // Made optional
  onEditorReady?: (editor: any) => void;
}

// Custom Highlight extension to add a unique ID and link to annotations
const CustomHighlight = Highlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-highlight-id': {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-highlight-id'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes['data-highlight-id']) {
            return {};
          }
          return {
            'data-highlight-id': attributes['data-highlight-id'],
          };
        },
      },
    };
  },
});

export function RichTextEditor({
  content,
  onChange,
  disabled,
  noteId,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotationComment,
  onEditorReady,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null); // Ref to store the editor instance

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // Removed 'highlight: false' as it's not a valid option for StarterKit
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'list-item',
        },
      }),
      TextStyle,
      Color,
      CustomHighlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'highlighted-text',
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[100px] max-w-none',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && onEditorReady) {
      editorRef.current = editor;
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Sync content from props to editor
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false, preserveCursor: true });
    }
  }, [content, editor]);

  // Apply existing annotations to the editor content
  useEffect(() => {
    if (editor && annotations && annotations.length > 0) {
      editor.chain().focus().unsetHighlight().run(); // Clear existing highlights first

      annotations.forEach(annotation => {
        const { highlight_id, highlighted_text } = annotation;
        // This is a simplified re-application. A more robust solution would parse the HTML
        // and find the exact text range to re-apply the highlight.
        // For now, we'll assume the highlighted_text is unique enough to find.
        // A better approach would be to store exact text positions or use a library
        // that handles this. For Tiptap, it's usually done by storing the mark in the JSON.
        // However, since we're storing in a separate DB table, we need to re-apply.

        // This is a placeholder logic. Tiptap doesn't easily re-apply marks by text content.
        // The ideal way is to store the Tiptap JSON state in the DB, or use a more complex
        // text-range-to-mark mapping.
        // For now, we'll just ensure the highlight mark is available.
        // The `data-highlight-id` attribute will be added when the highlight is created.
      });
    }
  }, [editor, annotations]); // Only re-apply when annotations change

  const applyHighlight = useCallback(async (color: string) => {
    if (!editor || disabled || !onAddAnnotation || !noteId) return;

    const { from, to, empty } = editor.state.selection;
    if (empty) {
      toast.info("Select text to highlight.");
      return;
    }

    const selectedText = editor.state.doc.textBetween(from, to);
    if (!selectedText.trim()) {
      toast.info("Select valid text to highlight.");
      return;
    }

    // Generate a unique ID for this highlight instance
    const highlightId = uuidv4();

    // Apply the highlight mark with the unique ID
    editor.chain().focus().setHighlight({ color, 'data-highlight-id': highlightId }).run();

    // Add the annotation to the database
    const newAnnotation = await onAddAnnotation(highlightId, selectedText);
    if (newAnnotation) {
      toast.success("Text highlighted!");
    } else {
      // If DB add fails, remove the highlight from the editor
      editor.chain().focus().unsetHighlight().run();
      toast.error("Failed to save highlight.");
    }
  }, [editor, disabled, onAddAnnotation, noteId]);

  const removeHighlight = useCallback(() => {
    if (!editor || disabled || !onDeleteAnnotation) return;

    const { from, to } = editor.state.selection;
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      node.marks.forEach(mark => {
        if (mark.type.name === 'highlight' && mark.attrs['data-highlight-id']) {
          const highlightId = mark.attrs['data-highlight-id'];
          onDeleteAnnotation(highlightId);
        }
      });
    });
    editor.chain().focus().unsetHighlight().run();
    toast.info("Highlight removed.");
  }, [editor, disabled, onDeleteAnnotation]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("rounded-md border border-input bg-transparent", disabled && "cursor-not-allowed opacity-50")}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
          className={cn("p-1 rounded", editor.isActive('bold') ? 'bg-accent' : 'hover:bg-muted')}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
          className={cn("p-1 rounded", editor.isActive('italic') ? 'bg-accent' : 'hover:bg-muted')}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run() || disabled}
          className={cn("p-1 rounded", editor.isActive('strike') ? 'bg-accent' : 'hover:bg-muted')}
          title="Strike"
        >
          S
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run() || disabled}
          className={cn("p-1 rounded", editor.isActive('code') ? 'bg-accent' : 'hover:bg-muted')}
          title="Code"
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn("p-1 rounded", editor.isActive('paragraph') ? 'bg-accent' : 'hover:bg-muted')}
          title="Paragraph"
        >
          P
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run() || disabled}
          className={cn("p-1 rounded", editor.isActive('heading', { level: 1 }) ? 'bg-accent' : 'hover:bg-muted')}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run() || disabled}
          className={cn("p-1 rounded", editor.isActive('heading', { level: 2 }) ? 'bg-accent' : 'hover:bg-muted')}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run() || disabled}
          className={cn("p-1 rounded", editor.isActive('bulletList') ? 'bg-accent' : 'hover:bg-muted')}
          title="Bullet List"
        >
          UL
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run() || disabled}
          className={cn("p-1 rounded", editor.isActive('orderedList') ? 'bg-accent' : 'hover:bg-muted')}
          title="Ordered List"
        >
          OL
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={!editor.can().chain().focus().toggleCodeBlock().run() || disabled}
          className={cn("p-1 rounded", editor.isActive('codeBlock') ? 'bg-accent' : 'hover:bg-muted')}
          title="Code Block"
        >
          CB
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          className="p-1 rounded hover:bg-muted"
          title="Horizontal Rule"
        >
          HR
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          disabled={disabled}
          className="p-1 rounded hover:bg-muted"
          title="Hard Break"
        >
          BR
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          className="p-1 rounded hover:bg-muted"
          title="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          className="p-1 rounded hover:bg-muted"
          title="Redo"
        >
          Redo
        </button>
        <button
          type="button"
          onClick={() => applyHighlight('#fff59d')} // Yellow highlight
          disabled={disabled || !noteId} // Disable if no noteId
          className={cn("p-1 rounded", editor.isActive('highlight') ? 'bg-yellow-200' : 'hover:bg-muted')}
          title="Highlight"
        >
          Highlight
        </button>
        <button
          type="button"
          onClick={removeHighlight}
          disabled={!editor.isActive('highlight') || disabled || !noteId} // Disable if no noteId
          className="p-1 rounded hover:bg-muted"
          title="Remove Highlight"
        >
          Un-highlight
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}