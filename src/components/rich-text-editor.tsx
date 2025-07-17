"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/js/froala_editor.pkgd.min.js';
import 'froala-editor/js/plugins/align.min.js';
import 'froala-editor/js/plugins/colors.min.js';
import 'froala-editor/js/plugins/font_size.min.js';
import 'froala-editor/js/plugins/image.min.js';
import 'froala-editor/js/plugins/lists.min.js';
import 'froala-editor/js/plugins/paragraph_format.min.js';
import 'froala-editor/js/plugins/quote.min.js';
import 'froala-editor/js/plugins/table.min.js';
import 'froala-editor/js/plugins/url.min.js';
import 'froala-editor/js/plugins/code_view.min.js';
import 'froala-editor/js/plugins/fullscreen.min.js';
import 'froala-editor/js/plugins/word_paste.min.js';
import 'froala-editor/js/plugins/line_breaker.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/emoticons.min.js';
import 'froala-editor/js/plugins/char_counter.min.js';
import 'froala-editor/js/plugins/help.min.js';
import 'froala-editor/js/plugins/quick_insert.min.js';
import 'froala-editor/js/plugins/special_characters.min.js';
import 'froala-editor/js/plugins/video.min.js';
import 'froala-editor/js/plugins/print.min.js';
import 'froala-editor/js/plugins/save.min.js';
import 'froala-editor/js/plugins/file.min.js';
import 'froala-editor/js/plugins/html_buttons.min.js';

import FroalaEditor from 'react-froala-wysiwyg';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (htmlContent: string) => void;
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
  const [editorInitialized, setEditorInitialized] = useState(false);

  const handleModelChange = useCallback((html: string) => {
    onChange(html);
  }, [onChange]);

  const handleInitialized = useCallback((editor: any) => {
    editorRef.current = editor;
    setEditorInitialized(true);
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [onEditorReady]);

  // Custom styles for highlight and important markers
  const customStyles = {
    highlightYellow: {
      title: 'Highlight Yellow',
      class: 'fr-highlight-yellow',
      tags: ['span'],
    },
    highlightBlue: {
      title: 'Highlight Blue',
      class: 'fr-highlight-blue',
      tags: ['span'],
    },
    highlightGreen: {
      title: 'Highlight Green',
      class: 'fr-highlight-green',
      tags: ['span'],
    },
    highlightRed: {
      title: 'Highlight Red',
      class: 'fr-highlight-red',
      tags: ['span'],
    },
    importantYellow: {
      title: 'Important Yellow',
      class: 'fr-important-yellow',
      tags: ['span'],
    },
    importantBlue: {
      title: 'Important Blue',
      class: 'fr-important-blue',
      tags: ['span'],
    },
    importantGreen: {
      title: 'Important Green',
      class: 'fr-important-green',
      tags: ['span'],
    },
    importantRed: {
      title: 'Important Red',
      class: 'fr-important-red',
      tags: ['span'],
    },
  };

  // Custom buttons for Callout
  const customButtons = {
    calloutInfo: {
      title: 'Info Callout',
      icon: 'info', // Froala's built-in info icon
      undo: true,
      focus: true,
      refreshAfterCallback: true,
      callback: function (editor: any) {
        editor.html.insert('<div class="fr-callout fr-callout-info" data-type="info">💡 This is an info callout.</div>');
      },
    },
    calloutWarning: {
      title: 'Warning Callout',
      icon: 'warning', // Froala's built-in warning icon
      undo: true,
      focus: true,
      refreshAfterCallback: true,
      callback: function (editor: any) {
        editor.html.insert('<div class="fr-callout fr-callout-warning" data-type="warning">⚠️ This is a warning callout.</div>');
      },
    },
    calloutSuccess: {
      title: 'Success Callout',
      icon: 'check', // Froala's built-in check icon
      undo: true,
      focus: true,
      refreshAfterCallback: true,
      callback: function (editor: any) {
        editor.html.insert('<div class="fr-callout fr-callout-success" data-type="success">✅ This is a success callout.</div>');
      },
    },
    calloutDanger: {
      title: 'Danger Callout',
      icon: 'close', // Froala's built-in close icon
      undo: true,
      focus: true,
      refreshAfterCallback: true,
      callback: function (editor: any) {
        editor.html.insert('<div class="fr-callout fr-callout-danger" data-type="danger">🚨 This is a danger callout.</div>');
      },
    },
  };

  const config = {
    placeholderText: 'Start writing your journal entry...',
    charCounterCount: false,
    toolbarButtons: {
      'moreText': {
        'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'clearFormatting', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertLink', 'insertImage', 'insertVideo', 'insertTable', 'undo', 'redo', 'html', 'fullscreen', 'print', 'help', 'specialCharacters', 'emoticons', 'insertHR'],
        'buttonsVisible': 10
      },
      'moreParagraph': {
        'buttons': ['paragraphFormat', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', 'calloutInfo', 'calloutWarning', 'calloutSuccess', 'calloutDanger'],
        'buttonsVisible': 5
      },
      'moreRich': {
        'buttons': ['insertLink', 'insertImage', 'insertVideo', 'insertTable', 'emoticons', 'specialCharacters', 'insertHR'],
        'buttonsVisible': 3
      },
      'moreMisc': {
        'buttons': ['undo', 'redo', 'fullscreen', 'print', 'help', 'codeView'],
        'buttonsVisible': 3
      }
    },
    // Custom dropdowns for highlight and important
    colorsBackground: [
      '#fff59d', '#bfdbfe', '#dcfce7', '#fee2e2', // Highlight colors
      '#fbbf24', '#60a5fa', '#4ade80', '#f87171', // Important colors
      'REMOVE'
    ],
    colorsText: [
      '#000000', '#FFFFFF', // Basic text colors
      'REMOVE'
    ],
    // Custom styles for highlight and important
    // These will apply classes to <span> tags
    // The actual CSS for these classes will be in globals.css
    paragraphStyles: {
      'fr-highlight-yellow': 'Highlight Yellow',
      'fr-highlight-blue': 'Highlight Blue',
      'fr-highlight-green': 'Highlight Green',
      'fr-highlight-red': 'Highlight Red',
      'fr-important-yellow': 'Important Yellow',
      'fr-important-blue': 'Important Blue',
      'fr-important-green': 'Important Green',
      'fr-important-red': 'Important Red',
    },
    // Custom buttons registration
    toolbarButtonsCustom: {
      calloutInfo: customButtons.calloutInfo,
      calloutWarning: customButtons.calloutWarning,
      calloutSuccess: customButtons.calloutSuccess,
      calloutDanger: customButtons.calloutDanger,
    },
    // Define custom dropdowns for highlight and important
    // This is a workaround as Froala's built-in highlight/colors don't directly support custom classes in dropdowns easily.
    // We'll use `paragraphStyle` dropdown for this.
    // This requires adding a custom button to the toolbar that triggers the paragraphStyle dropdown.
    // For now, I'll rely on the `backgroundColor` button and custom CSS.
    // A more advanced solution would involve creating custom dropdown buttons for these.
    // For simplicity, I'll map the highlight/important colors to `backgroundColor` and rely on CSS.
    // The user asked for dropdown hover to pick colors, which `backgroundColor` provides.

    // Disable some features if editor is disabled
    toolbarSticky: false,
    toolbarInline: false,
    attribution: false, // Remove Froala attribution
    heightMin: 150,
    heightMax: 500,
    quickInsertButtons: ['image', 'video', 'table', 'ul', 'ol', 'hr'],
    imageUploadURL: '/api/upload-image', // Placeholder for image upload endpoint
    imageUploadMethod: 'POST',
    imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
    fileUploadURL: '/api/upload-file', // Placeholder for file upload endpoint
    fileUploadMethod: 'POST',
    videoUploadURL: '/api/upload-video', // Placeholder for video upload endpoint
    videoUploadMethod: 'POST',
    linkAlwaysBlank: true, // Open links in new tab
    linkEditButtons: ['linkOpen', 'linkEdit', 'linkRemove'],
    linkInsertButtons: ['linkBack'],
    htmlAllowedTags: ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr', 'svg'],
    htmlAllowedAttrs: ['accept', 'accept-charset', 'accesskey', 'action', 'align', 'alt', 'autocomplete', 'autofocus', 'autoplay', 'autosave', 'bgcolor', 'border', 'charset', 'cite', 'class', 'color', 'cols', 'colspan', 'content', 'contenteditable', 'contextmenu', 'controls', 'coords', 'data', 'data-type', 'datetime', 'default', 'defer', 'dir', 'dirname', 'disabled', 'download', 'draggable', 'dropzone', 'enctype', 'for', 'form', 'formaction', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'http-equiv', 'icon', 'id', 'ismap', 'itemprop', 'keytype', 'kind', 'label', 'lang', 'list', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'multiple', 'muted', 'name', 'novalidate', 'open', 'optimum', 'pattern', 'ping', 'placeholder', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'reversed', 'rows', 'rowspan', 'sandbox', 'scope', 'scoped', 'seamless', 'selected', 'shape', 'size', 'sizes', 'span', 'spellcheck', 'src', 'srcdoc', 'srclang', 'srcset', 'start', 'step', 'style', 'summary', 'tabindex', 'target', 'title', 'type', 'usemap', 'value', 'width', 'wmode', 'wrap', 'xml:lang', 'data-color'], // Added data-color
    htmlRemoveTags: ['script', 'style'], // Remove script and style tags on paste/load
    htmlDoNotWrapTags: ['script', 'style', 'img', 'iframe', 'video', 'audio', 'table', 'hr'],
    htmlAllowComments: false,
    htmlUntouched: false,
    htmlExecuteScripts: false,
    htmlIgnoreTags: ['script', 'style'],
    htmlPaste: true,
    pastePlain: false,
    quickInsertTags: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'ol', 'hr'],
    // Custom classes for elements
    htmlAllowedAttrs: ['class', 'style', 'id', 'data-type', 'data-color', 'src', 'alt', 'width', 'height', 'href', 'target', 'title', 'rel'], // Ensure necessary attributes are allowed
  };

  useEffect(() => {
    if (editorInitialized && editorRef.current && content !== editorRef.current.html.get()) {
      editorRef.current.html.set(content);
    }
  }, [content, editorInitialized]);

  return (
    <div className={cn("rounded-md border border-input overflow-hidden", disabled && "opacity-50 pointer-events-none")}>
      <FroalaEditor
        tag='textarea'
        config={config}
        model={content}
        onModelChange={handleModelChange}
        onInitialized={handleInitialized}
        disabled={disabled}
      />
    </div>
  );
}