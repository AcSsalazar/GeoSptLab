import ManualViewer from "../components/MarkdownViewer"


function Manual() {
  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <ManualViewer filePath="/ManualDeUsuario.md" />
    </div>
  );
}
export default Manual