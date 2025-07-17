declare module 'react-trix-editor' {
  import * as React from 'react';

  interface TrixEditorProps {
    input: string;
    className?: string;
    autoFocus?: boolean;
    placeholder?: string;
    value?: string;
    readOnly?: boolean;
    fileUpload?: boolean;
    editorRef?: React.RefObject<HTMLDivElement>;
    onChange?: (event: CustomEvent) => void;
    onEditorReady?: (editor: any) => void;
  }

  export class TrixEditor extends React.Component<TrixEditorProps> {}
}