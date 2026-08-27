// app/blog/[slug]/page.tsx
import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { BlogRenderer } from '@/components/blog/BlogRenderer';
import { Metadata } from 'next';
import { ContentBlock } from '@/types/blog';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: 'Not Found' };
  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, status: 'PUBLISHED' },
    include: { author: { select: { name: true } } }
  });

  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Meta Header */}
      <div className="flex gap-2 items-center mb-3">
        <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-medium">
          {post.category}
        </span>
        <span className="text-sm text-gray-500">
          {post.publishedAt?.toLocaleDateString('en-IN', { 
            day: 'numeric', month: 'short', year: 'numeric' 
          })} · {post.readTime} min read
        </span>
      </div>
      
      <h1 className="text-3xl font-semibold leading-tight mb-5">{post.title}</h1>
      
      {post.excerpt && (
        <p className="text-lg text-gray-800 leading-relaxed mb-6">{post.excerpt}</p>
      )}
      
      {/* Content Blocks Renderer */}
      <BlogRenderer content={post.content as unknown as ContentBlock[]} />
    </article>
  );
}