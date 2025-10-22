import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For tables, strikethrough, etc.
import styles from '@/styles/pages/MarkdownViewer.module.css';

interface MarkdownViewerProps {
  filePath: string; // Path to markdown file
  className?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ filePath, className }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        setLoading(true);
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load markdown: ${response.statusText}`);
        }
        const text = await response.text();
        setContent(text);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadMarkdown();
  }, [filePath]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading documentation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Error Loading Documentation</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.markdownContainer} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom component rendering
          h1: (props) => <h1 className={styles.h1} {...props} />,
          h2: (props) => <h2 className={styles.h2} {...props} />,
          h3: (props) => <h3 className={styles.h3} {...props} />,
          p: (props) => <p className={styles.paragraph} {...props} />,
          code: (props) => {
            const { className, children, ...rest } = props;
            const isInline = !className;
            return isInline ? (
              <code className={styles.inlineCode} {...rest}>{children}</code>
            ) : (
              <code className={styles.codeBlock} {...rest}>{children}</code>
            );
          },
          pre: (props) => <pre className={styles.pre} {...props} />,
          ul: (props) => <ul className={styles.ul} {...props} />,
          ol: (props) => <ol className={styles.ol} {...props} />,
          li: (props) => <li className={styles.li} {...props} />,
          table: (props) => <table className={styles.table} {...props} />,
          th: (props) => <th className={styles.th} {...props} />,
          td: (props) => <td className={styles.td} {...props} />,
          blockquote: (props) => <blockquote className={styles.blockquote} {...props} />,
          a: (props) => <a className={styles.link} {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
