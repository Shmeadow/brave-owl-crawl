"use client";

import React, { useEffect, useRef } from 'react';
import { TrixEditor as ReactTrixEditor } from 'react-trix-editor';
import { cn } from '@/lib/utils';

// Declare Trix global for TypeScript
declare global {
  interface Window {
    Trix: any;
  }
}

interface TrixEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
  disabled?: boolean;
}

export function TrixEditor({ content, onChange, disabled }: TrixEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Ensure Trix is loaded before attempting to set content
    if (editorRef.current && window.Trix && window.Trix.config) {
      const editorElement = editorRef.current.querySelector('trix-editor') as HTMLElement & { editor: any };
      if (editorElement && editorElement.editor) {
        // Only update content if it's different from the current editor content
        // This prevents cursor jumps and unnecessary re-renders
        if (editorElement.editor.getHTML() !== content) {
          editorElement.editor.loadHTML(content);
        }
      }
    }
  }, [content]);

  const handleChange = (event: CustomEvent) => {
    if (isMounted.current) {
      onChange(event.detail.editor.getHTML());
    }
  };

  return (
    <div className={cn("rounded-md border border-input bg-transparent", disabled && "cursor-not-allowed opacity-50")}>
      <ReactTrixEditor
        input="trix-editor-input"
        editorRef={editorRef}
        className="trix-content min-h-[150px] p-2" // Apply min-height and padding
        onChange={handleChange}
        readOnly={disabled}
      />
      <input type="hidden" id="trix-editor-input" name="content" value={content} />
    </div>
  );
}