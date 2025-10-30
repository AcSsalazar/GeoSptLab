import MarkdownViewer from '@/components/MarkdownViewer';


export default function Documentation() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <MarkdownViewer filePath="/DevDocs.md" />
    </div>
  );
}

