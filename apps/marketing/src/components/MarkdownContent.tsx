'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Personalizar componentes específicos si es necesario
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              className="text-[var(--tp-buttons)] hover:underline"
              target={props.href?.startsWith('http') ? '_blank' : undefined}
              rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table {...props} className="min-w-full divide-y divide-gray-200 border border-gray-200" />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="px-4 py-3 bg-gray-50 text-left text-sm font-semibold text-gray-900 border-b border-gray-200" />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200" />
          ),
          code: ({ node, inline, ...props }) => (
            inline ? (
              <code {...props} className="px-1.5 py-0.5 bg-gray-100 text-[var(--tp-buttons)] rounded text-sm font-mono" />
            ) : (
              <code {...props} className="block p-4 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto" />
            )
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-4 border-[var(--tp-buttons)] pl-4 py-2 my-4 italic text-gray-600" />
          ),
          h1: ({ node, ...props }) => (
            <h1 {...props} className="text-4xl font-bold text-gray-900 mt-8 mb-4 first:mt-0" />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0" />
          ),
          h3: ({ node, ...props }) => (
            <h3 {...props} className="text-2xl font-bold text-gray-900 mt-6 mb-3" />
          ),
          h4: ({ node, ...props }) => (
            <h4 {...props} className="text-xl font-bold text-gray-900 mt-4 mb-2" />
          ),
          p: ({ node, ...props }) => (
            <p {...props} className="text-gray-700 leading-relaxed mb-4" />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc list-inside my-4 space-y-2 text-gray-700" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal list-inside my-4 space-y-2 text-gray-700" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="text-gray-700 ml-4" />
          ),
          strong: ({ node, ...props }) => (
            <strong {...props} className="font-semibold text-gray-900" />
          ),
          em: ({ node, ...props }) => (
            <em {...props} className="italic" />
          ),
          hr: ({ node, ...props }) => (
            <hr {...props} className="my-8 border-gray-300" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

