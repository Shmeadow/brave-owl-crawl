"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's styles
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Strikethrough, Pilcrow, Heading1, Heading2, List, ListOrdered,
  Highlighter, X, Quote, Code, Minus, ListChecks, Lightbulb, Star, Undo, Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Register custom formats/modules if they don't exist
if (typeof window !== 'undefined') {
  // @ts-ignore
  if (!Quill.imports['formats/important']) {
    const Inline = Quill.import('blots/inline');
    class ImportantBlot extends Inline {
      static blotName = 'important';
      static tagName = 'span';
      static className = 'important-journal-item';

      static create(value: string) {
        const node = super.create(value);
        node.dataset.color = value;
        return node;
      }

      static formats(node: HTMLElement) {
        return node.dataset.color;
      }
    }
    Quill.register(ImportantBlot);
  }

  // @ts-ignore
  if (!Quill.imports['formats/callout']) {
    const Block = Quill.import('blots/block');
    class CalloutBlot extends Block {
      static blotName = 'callout';
      static tagName = 'div';
      static className = 'prose-callout';

      static create(value: string) {
        const node = super.create(value);
        node.dataset.type = value;
        return node;
      }

      static formats(node: HTMLElement) {
        return node.dataset.type;
      }
    }
    Quill.register(CalloutBlot);
  }

  // Custom Font Size
  const Size = Quill.import('attributors/style/size');
  Size.whitelist = ['12px', '16px', '20px', '24px'];
  Quill.register(Size, true);

  // Custom Highlight (background color)
  const Background = Quill.import('attributors/style/background');
  Background.whitelist = ['#fff59d', 'transparent']; // Add specific highlight color
  Quill.register(Background, true);
}


interface QuillEditorProps {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function QuillEditor({ content, onChange, disabled }: QuillEditorProps) {
  const quillRef = useRef<ReactQuill | null>(null);
  const [editorHtml, setEditorHtml] = useState(content);

  useEffect(() => {
    // Update internal state only if external content changes and it's different
    if (quillRef.current && quillRef.current.editor && content !== editorHtml) {
      const currentQuillHtml = quillRef.current.editor.root.innerHTML;
      if (content !== currentQuillHtml) {
        setEditorHtml(content);
      }
    }
  }, [content, editorHtml]);

  const handleChange = useCallback((html: string) => {
    setEditorHtml(html);
    onChange(html);
  }, [onChange]);

  const modules = React.useMemo(() => ({
    toolbar: {
      container: '#toolbar',
      handlers: {
        'important': function(value: string) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range && range.length > 0) {
              const format = quill.getFormat(range);
              if (format.important === value) {
                quill.format('important', false);
              } else {
                quill.format('important', value);
              }
            }
          }
        },
        'callout': function(value: string) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              const [block, offset] = quill.getLine(range.index);
              if (block.blotName === 'callout' && block.domNode.dataset.type === value) {
                quill.formatLine(range.index, range.length, 'callout', false);
              } else {
                quill.formatLine(range.index, range.length, 'callout', value);
              }
            }
          }
        },
        'highlight': function(value: string) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range && range.length > 0) {
              const format = quill.getFormat(range);
              if (format.background === value) {
                quill.format('background', false);
              } else {
                quill.format('background', value);
              }
            }
          }
        },
        'unhighlight': function() {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range && range.length > 0) {
              quill.format('background', false);
            }
          }
        },
      }
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    },
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'list', 'bullet', 'ordered', 'indent',
    'link', 'image', 'color', 'background', 'align', 'important', 'callout'
  ];

  const starColors = [
    { name: 'Yellow', value: '#fbbf24' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Green', value: '#4ade80' },
    { name: 'Red', value: '#f87171' },
  ];

  return (
    <div className={cn("rounded-md border border-input bg-transparent", disabled && "cursor-not-allowed opacity-50")}>
      <div id="toolbar" className="flex flex-wrap items-center gap-1 p-2 border-b border-input">
        {/* Style Group */}
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('bold', !quillRef.current?.getEditor()?.getFormat().bold)} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().bold && 'ring-2 ring-primary')} title="Bold"><Bold className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('italic', !quillRef.current?.getEditor()?.getFormat().italic)} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().italic && 'ring-2 ring-primary')} title="Italic"><Italic className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('strike', !quillRef.current?.getEditor()?.getFormat().strike)} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().strike && 'ring-2 ring-primary')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Font Size */}
        <Select
          value={quillRef.current?.getEditor()?.getFormat().size || '16px'}
          onValueChange={(value) => quillRef.current?.getEditor()?.format('size', value)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[80px] h-8 text-xs">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent className="z-[1200]">
            <SelectItem value="12px">Small</SelectItem>
            <SelectItem value="16px">Normal</SelectItem>
            <SelectItem value="20px">Large</SelectItem>
            <SelectItem value="24px">X-Large</SelectItem>
          </SelectContent>
        </Select>
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Block Type Group */}
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('header', false)} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", !quillRef.current?.getEditor()?.getFormat().header && 'ring-2 ring-primary')} title="Paragraph"><Pilcrow className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('header', 1)} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().header === 1 && 'ring-2 ring-primary')} title="Heading 1"><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('header', 2)} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().header === 2 && 'ring-2 ring-primary')} title="Heading 2"><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('blockquote', !quillRef.current?.getEditor()?.getFormat().blockquote)} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().blockquote && 'ring-2 ring-primary')} title="Blockquote"><Quote className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('code-block', !quillRef.current?.getEditor()?.getFormat()['code-block'])} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat()['code-block'] && 'ring-2 ring-primary')} title="Code Block"><Code className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            const index = range?.index ?? 0; // Use nullish coalescing for index
            quill.insertEmbed(index, 'hr', true);
          }
        }} disabled={disabled} variant="ghost" size="icon" className="h-8 w-8" title="Horizontal Rule"><Minus className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.getModule('toolbar').handlers['callout']('info')} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().callout && 'ring-2 ring-primary')} title="Callout"><Lightbulb className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* List Group */}
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('list', 'bullet')} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().list === 'bullet' && 'ring-2 ring-primary')} title="Bullet List"><List className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.format('list', 'ordered')} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().list === 'ordered' && 'ring-2 ring-primary')} title="Ordered List"><ListOrdered className="h-4 w-4" /></Button>
        {/* Quill doesn't have native task lists, so this is a placeholder or requires custom module */}
        <Button type="button" disabled={true} variant="ghost" size="icon" className="h-8 w-8 opacity-50 cursor-not-allowed" title="Task List (Coming Soon)"><ListChecks className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Highlight Group */}
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.getModule('toolbar').handlers['highlight']('#fff59d')} disabled={disabled} variant="ghost" size="icon" className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().background === '#fff59d' && 'ring-2 ring-primary')} title="Highlight"><Highlighter className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.getModule('toolbar').handlers['unhighlight']()} disabled={disabled} variant="ghost" size="icon" className="h-8 w-8" title="Remove Highlight"><X className="h-4 w-4" /></Button>
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Important/Star Group */}
        {starColors.map(color => (
          <Button
            key={color.value}
            type="button"
            onClick={() => quillRef.current?.getEditor()?.getModule('toolbar').handlers['important'](color.value)}
            disabled={disabled}
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", quillRef.current?.getEditor()?.getFormat().important === color.value && 'ring-2 ring-primary')}
            title={`Mark as ${color.name} Important`}
          >
            <Star className="h-4 w-4" style={{ color: color.value, fill: quillRef.current?.getEditor()?.getFormat().important === color.value ? color.value : 'transparent' }} />
          </Button>
        ))}
        <div className="flex-grow" />

        {/* History Group */}
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.getModule('history')?.undo()} disabled={disabled} variant="ghost" size="icon" className="h-8 w-8" title="Undo"><Undo className="h-4 w-4" /></Button>
        <Button type="button" onClick={() => quillRef.current?.getEditor()?.getModule('history')?.redo()} disabled={disabled} variant="ghost" size="icon" className="h-8 w-8" title="Redo"><Redo className="h-4 w-4" /></Button>
      </div>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorHtml}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        readOnly={disabled}
        className="min-h-[150px] max-w-none"
      />
    </div>
  );
}