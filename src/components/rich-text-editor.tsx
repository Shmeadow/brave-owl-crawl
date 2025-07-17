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
import { Important, Callout } from '@/lib/tiptap-extensions'; // Import Callout
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Star, Undo, Redo, Bold, Italic, Strikethrough, Pilcrow, Heading1, Heading2, List, ListOrdered, Highlighter, X, Quote, Code, Minus, ListChecks, Lightbulb, Image as ImageIcon } from 'lucide-react'; // Import ListChecks, Lightbulb, ImageIcon
import { Separator } from '@/components/ui/separator';
import { FontSize } from '@tiptap/extension-font-size';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from '@tiptap/extension-image'; // Import Image extension

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
        blockquote: { HTMLAttributes: { class: 'prose-blockquote' } },
        codeBlock: { HTMLAttributes: { class: 'prose-code-block' } },
        horizontalRule: { HTMLAttributes: { class: 'prose-hr' } },
      }),
      ListItem.configure({ HTMLAttributes: { class: 'list-item' } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Important,
      FontSize,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Callout,
      Image.configure({
        inline: false, // Images are block-level by default
        allowBase64: true, // Allow base64 images (e.g., pasted from clipboard)
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[150px] max-w-none',
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

  const addImage = useCallback(() => {
    const url = window.prompt('URL');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border border-input bg-transparent", disabled && "cursor-not-allowed opacity-50")}>
      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-input"> {/* Reduced gap and padding */}
        {/* Style Group */}
        <Button type="button" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('bold') && 'ring-2 ring-primary')} title="Bold"><Bold className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('italic') && 'ring-2 ring-primary')} title="Italic"><Italic className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('strike') && 'ring-2 ring-primary')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Font Size */}
        <Select
          value={editor.getAttributes('textStyle').fontSize || 'default-size'}
          onValueChange={(value) => {
            if (value === 'default-size') {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(value).run();
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[80px] h-8 text-xs">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            <SelectItem value="default-size">Default</SelectItem>
            <SelectItem value="12px">Small</SelectItem>
            <SelectItem value="16px">Normal</SelectItem>
            <SelectItem value="20px">Large</SelectItem>
            <SelectItem value="24px">X-Large</SelectItem>
          </SelectContent>
        </Select>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Block Type Group */}
        <Button type="button" onClick={() => editor.chain().focus().setParagraph().run()} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('paragraph') && 'ring-2 ring-primary')} title="Paragraph"><Pilcrow className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) && 'ring-2 ring-primary')} title="Heading 1"><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) && 'ring-2 ring-primary')} title="Heading 2"><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={!editor.can().chain().focus().toggleBlockquote().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('blockquote') && 'ring-2 ring-primary')} title="Blockquote"><Quote className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={!editor.can().chain().focus().toggleCodeBlock().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('codeBlock') && 'ring-2 ring-primary')} title="Code Block"><Code className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={!editor.can().chain().focus().setHorizontalRule().run() || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Divider"><Minus className="h-4 w-4" /></Button> {/* Renamed to Divider */}
        <Button type="button" onClick={() => editor.chain().focus().toggleCallout().run()} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('callout') && 'ring-2 ring-primary')} title="Callout"><Lightbulb className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* List Group */}
        <Button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={!editor.can().chain().focus().toggleBulletList().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('bulletList') && 'ring-2 ring-primary')} title="Bullet List"><List className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={!editor.can().chain().focus().toggleOrderedList().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('orderedList') && 'ring-2 ring-primary')} title="Ordered List"><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().toggleTaskList().run()} disabled={!editor.can().chain().focus().toggleTaskList().run() || disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('taskList') && 'ring-2 ring-primary')} title="Task List"><ListChecks className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Highlight Group */}
        <Button type="button" onClick={() => editor.chain().focus().setHighlight({ color: '#fff59d' }).run()} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('highlight', { color: '#fff59d' }) && 'ring-2 ring-primary')} title="Highlight"><Highlighter className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()} disabled={!editor.isActive('highlight') || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Remove Highlight"><X className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Important/Star Group */}
        {starColors.map(color => (
          <Button
            key={color.value}
            type="button"
            onClick={() => {
              if (editor.isActive('important', { color: color.value })) {
                editor.chain().focus().unsetImportant().run();
              } else {
                editor.chain().focus().toggleImportant({ color: color.value }).run();
              }
            }}
            disabled={editor.state.selection.empty || disabled}
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor.isActive('important', { color: color.value }) && 'ring-2 ring-primary')}
            title={`Mark as ${color.name} Important`}
          >
            <Star className="h-4 w-4" style={{ color: color.value, fill: editor.isActive('important', { color: color.value }) ? color.value : 'transparent' }} />
          </Button>
        ))}
        <Separator orientation="vertical" className="h-6 mx-1" />
        {/* Image Button */}
        <Button type="button" onClick={addImage} disabled={disabled} variant="ghost" size="icon" className="h-8 w-8" title="Insert Image"><ImageIcon className="h-4 w-4" /></Button>
        <div className="flex-grow" />
        {/* History Group */}
        <Button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Undo"><Undo className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || disabled} variant="ghost" size="icon" className="h-8 w-8" title="Redo"><Redo className="h-4 w-4" /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}