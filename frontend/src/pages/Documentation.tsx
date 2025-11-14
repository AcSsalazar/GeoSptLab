import MarkdownViewer from '@/components/MarkdownViewer';

export default function Documentation() {
  return (
    <div style={{ padding: '1.5rem'}}>
      <MarkdownViewer filePath="/DevDocs.md" />
    </div>
  );
}

