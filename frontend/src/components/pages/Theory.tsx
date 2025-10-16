import ManualViewer from "../MarkdownViewer"


function TheoryDoc() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <ManualViewer filePath="/BaseTeorica.md" />
    </div>
  );
}
export default TheoryDoc;