"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Highlight } from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Button } from '@/components/ui/button';
import { Important } from '@/lib/tiptap-extensions';
import { Star, Undo, Redo, Bold, Italic, Strikethrough, Pilcrow, Heading1, Heading2, List, ListOrdered, Highlighter, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  content: string;
  onChange: (richText: string) => void;
  disabled?: boolean;
  onEditorReady?: (editor: any) => void;
}

export function RichTextEditor({
  content,
  onChange,
  disabled,
  onEditorReady,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  const starColors = [
    { name: 'Yellow', value: '#fbbf24' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Green', value: '#4ade80' },
    { name: 'Red', value: '#f87171' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      ListItem.configure({ HTMLAttributes: { class: 'list-item' } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Important,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[300px] max-w-none',
      },
    },
    onUpdate({ editor }) {
      onChange(JSON.stringify(editor.getJSON()));
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

  useEffect(() => {
    if (editor) {
      const isJson = (str: string) => {
        try { JSON.parse(str); } catch (e) { return false; }
        return true;
      };
      const currentJsonContent = JSON.stringify(editor.getJSON());
      if (isJson(content)) {
        if (content !== currentJsonContent) {
          editor.commands.setContent(JSON.parse(content), { emitUpdate: false });
        }
      } else {
        if (content !== editor.getHTML()) {
          editor.commands.setContent(content, { emitUpdate: false });
        }
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border border-input bg-transparent", disabled && "cursor-not-allowed opacity-50")}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-input">
        {/* Style Group */}
        <Button type="button" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('bold') && 'bg-accent')} title="Bold"><Bold className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('italic') && 'bg-accent')} title="Italic"><Italic className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('strike') && 'bg-accent')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Block Type Group */}
        <Button type="button" onClick={() => editor.chain().focus().setParagraph().run()} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('paragraph') && 'bg-accent')} title="Paragraph"><Pilcrow className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) && 'bg-accent')} title="Heading 1"><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) && 'bg-accent')} title="Heading 2"><Heading2 className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* List Group */}
        <Button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={!editor.can().chain().focus().toggleBulletList().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('bulletList') && 'bg-accent')} title="Bullet List"><List className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={!editor.can().chain().focus().toggleOrderedList().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('orderedList') && 'bg-accent')} title="Ordered List"><ListOrdered className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Highlight Group */}
        <Button type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: '#fff59d' }).run()} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('highlight', { color: '#fff59d' }) && 'ring-2 ring-yellow-500')} title="Highlight"><Highlighter className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} disabled={!editor.isActive('highlight') || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Remove Highlight"><X className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Important/Star Group */}
        {starColors.map(color => (
          <Button
            key={color.value}
            type="button"
            onClick={() => editor.chain().focus().toggleImportant({ color: color.value }).run()}
            disabled={editor.state.selection.empty || disabled}
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive('important', { color: color.value }) && 'bg-accent')}
            title={`Mark as ${color.name} Important`}
          >
            <Star className="h-4 w-4" style={{ color: color.value, fill: editor.isActive('important', { color: color.value }) ? color.value : 'transparent' }} />
          </Button>
        ))}
        <Button type="button" onClick={() => editor.chain().focus().unsetImportant().run()} disabled={!editor.isActive('important') || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Remove Importance"><X className="h-4 w-4" /></Button>
        <div className="flex-grow" />
        {/* History Group */}
        <Button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Undo"><Undo className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Redo"><Redo className="h-4 w-4" /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}