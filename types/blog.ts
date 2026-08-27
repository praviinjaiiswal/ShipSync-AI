// types/blog.ts

export type BlockType = 
  | 'paragraph' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3'
  | 'image'
  | 'table'
  | 'callout'
  | 'quote'
  | 'bulletList'
  | 'numberedList'
  | 'asciiDiagram'
  | 'ctaCard'
  | 'keyTakeaway'
  | 'warning'
  | 'faq'
  | 'videoEmbed'
  | 'lead';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: any;
}

// Specific block content shapes
export interface ParagraphBlock {
  text: string;
}

export interface HeadingBlock {
  text: string;
  anchor?: string;
}

export interface ImageBlock {
  src: string;
  alt: string;
  caption?: string;
}

export interface TableBlock {
  headers: string[];
  rows: string[][];
}

export interface CalloutBlock {
  variant: 'info' | 'warning' | 'tip' | 'success';
  title: string;
  text: string;
}

export interface QuoteBlock {
  text: string;
  author: string;
  source?: string;
}

export interface ListBlock {
  items: string[];
}

export interface AsciiBlock {
  code: string;
  caption?: string;
}

export interface CtaBlock {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  variant?: 'primary' | 'secondary';
}

export interface KeyTakeawayBlock {
  items: string[];
}

export interface FaqBlock {
  items: { question: string; answer: string }[];
}

export interface VideoBlock {
  url: string; // YouTube/Vimeo embed URL
  title?: string;
}