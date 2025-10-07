import MarkdownViewer from '@/components/MarkdownViewer';


export default function DocumentationPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <MarkdownViewer filePath="/GeoSptLab_Manual.md" />
    </div>
  );
}

