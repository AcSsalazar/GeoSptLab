import MarkdownViewer from "@/components/MarkdownViewer";


function TheoryDoc() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <MarkdownViewer filePath="/BaseTeorica.md" />
    </div>
  );
}
export default TheoryDoc;