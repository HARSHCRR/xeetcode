'use client';

import Editor, { loader } from '@monaco-editor/react';

/**
 * Serve Monaco from our own origin instead of the default CDN.
 *
 * The editor is the match, so a blocked or unreachable CDN would make the
 * product unusable. `scripts/copy-monaco.mjs` puts these files in public/ at
 * build time.
 */
loader.config({ paths: { vs: '/monaco/vs' } });

/** Matches the app's theme tokens so the editor doesn't look bolted on. */
const EDITOR_THEME = 'xeetcode-dark';

/** Monaco's id for each language we offer. */
const MONACO_LANGUAGE: Record<string, string> = { cpp: 'cpp', javascript: 'javascript' };

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  readOnly = false,
}: {
  value: string;
  onChange: (next: string) => void;
  language?: string;
  readOnly?: boolean;
}) {
  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGE[language] ?? 'javascript'}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      theme={EDITOR_THEME}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme(EDITOR_THEME, {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#1a1a1a',
            'editorGutter.background': '#1a1a1a',
            'editor.lineHighlightBackground': '#282828',
            'editorLineNumber.foreground': '#808080',
            'editorLineNumber.activeForeground': '#eff1f6',
          },
        });
      }}
      options={{
        readOnly,
        fontSize: 14,
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'line',
        lineNumbersMinChars: 3,
        overviewRulerLanes: 0,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      }}
      loading={<div className="p-4 text-sm text-ink-faint">Loading editor…</div>}
    />
  );
}
