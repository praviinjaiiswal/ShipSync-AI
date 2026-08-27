// components/blog/BlogRenderer.tsx
'use client';

import { ContentBlock } from '@/types/blog';
import { 
  Info, AlertTriangle, CheckCircle, Pin, 
  Download, Play, ChevronDown 
} from 'lucide-react';
import { useState } from 'react';

export function BlogRenderer({ content }: { content: ContentBlock[] }) {
  return (
    <div className="space-y-0">
      {content.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="text-base leading-7 text-gray-600 mb-4">{block.content.text}</p>;
    
    case 'lead':
      return <p className="text-lg text-gray-900 leading-relaxed mb-5">{block.content.text}</p>;
    
    case 'heading1':
      return <h1 className="text-2xl font-semibold mt-10 mb-3" id={block.content.anchor}>{block.content.text}</h1>;
    
    case 'heading2':
      return <h2 className="text-xl font-semibold mt-8 mb-3" id={block.content.anchor}>{block.content.text}</h2>;
    
    case 'heading3':
      return <h3 className="text-lg font-medium mt-6 mb-2">{block.content.text}</h3>;
    
    case 'image':
      return (
        <figure className="my-5">
          <img src={block.content.src} alt={block.content.alt} className="w-full rounded-lg" />
          {block.content.caption && (
            <figcaption className="text-sm text-gray-500 mt-2 text-center">{block.content.caption}</figcaption>
          )}
        </figure>
      );
    
    case 'table':
      return (
        <div className="overflow-x-auto my-5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {block.content.headers.map((h: string, i: number) => (
                  <th key={i} className="text-left p-3 font-medium border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.content.rows.map((row: string[], i: number) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="p-3 border-b text-gray-600">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    
    case 'callout':
      const calloutStyles = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        tip: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        success: 'bg-green-50 border-green-200 text-green-800',
      };
      const icons = { info: Info, warning: AlertTriangle, tip: CheckCircle, success: CheckCircle };
      const Icon = icons[block.content.variant as keyof typeof icons];
      return (
        <div className={`flex gap-3 p-4 rounded-lg border my-5 ${calloutStyles[block.content.variant as keyof typeof calloutStyles]}`}>
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">{block.content.title}</p>
            <p className="text-sm leading-relaxed opacity-90">{block.content.text}</p>
          </div>
        </div>
      );
    
    case 'quote':
      return (
        <blockquote className="border-l-3 border-gray-300 pl-5 my-5 italic text-gray-600">
          <p className="leading-relaxed">{block.content.text}</p>
          <footer className="text-sm text-gray-400 mt-2 not-italic">— {block.content.author}</footer>
        </blockquote>
      );
    
    case 'bulletList':
      return (
        <ul className="list-disc pl-5 my-4 space-y-2">
          {block.content.items.map((item: string, i: number) => (
            <li key={i} className="text-gray-600 leading-7" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
    
    case 'numberedList':
      return (
        <ol className="list-decimal pl-5 my-4 space-y-2">
          {block.content.items.map((item: string, i: number) => (
            <li key={i} className="text-gray-600 leading-7" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ol>
      );
    
    case 'asciiDiagram':
      return (
        <div className="my-5">
          <pre className="bg-gray-50 p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto text-gray-600">
            {block.content.code}
          </pre>
          {block.content.caption && <p className="text-xs text-gray-400 mt-2">{block.content.caption}</p>}
        </div>
      );
    
    case 'ctaCard':
      return (
        <div className="bg-gray-900 text-white rounded-xl p-6 my-6 text-center">
          <h3 className="text-lg font-semibold mb-2">{block.content.title}</h3>
          <p className="text-sm text-gray-300 mb-4">{block.content.description}</p>
          <a href={block.content.buttonLink} className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100">
            <Download className="w-4 h-4" />
            {block.content.buttonText}
          </a>
        </div>
      );
    
    case 'keyTakeaway':
      return (
        <div className="bg-gray-50 rounded-lg p-5 my-6">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-4 h-4" />
            <span className="font-medium text-sm">Key takeaways</span>
          </div>
          <ul className="space-y-2">
            {block.content.items.map((item: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    
    case 'warning':
      return (
        <div className="flex gap-3 p-4 rounded-lg border border-red-200 bg-red-50 my-5">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm text-red-800 mb-1">Important</p>
            <p className="text-sm text-red-700 leading-relaxed">{block.content.text}</p>
          </div>
        </div>
      );
    
    case 'faq':
      return (
        <div className="my-5 divide-y divide-gray-200">
          {block.content.items.map((item: {question: string, answer: string}, i: number) => (
            <FaqItem key={i} question={item.question} answer={item.answer} />
          ))}
        </div>
      );
    
    case 'videoEmbed':
      return (
        <div className="my-5 rounded-lg overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
          <iframe 
            src={block.content.url} 
            title={block.content.title || 'Video'} 
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      );
    
    default:
      return null;
  }
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-3">
      <button onClick={() => setOpen(!open)} className="flex justify-between items-center w-full text-left">
        <span className="font-medium text-sm">{question}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{answer}</p>}
    </div>
  );
}