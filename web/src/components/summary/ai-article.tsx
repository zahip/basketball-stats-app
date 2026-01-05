'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AIArticleProps {
  summary: string
}

export function AIArticle({ summary }: AIArticleProps) {
  // Split summary by double newlines to create paragraphs
  const paragraphs = summary.split('\n\n').filter((p) => p.trim().length > 0)

  return (
    <Card className="p-8">
      <CardHeader className="pb-4 px-0">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">AI Generated</Badge>
          <span className="text-sm text-muted-foreground">Game Summary</span>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {/* Hebrew article with RTL support */}
        <article
          dir="rtl"
          className={cn(
            'text-right space-y-4',
            'font-serif text-lg leading-relaxed',
            'text-foreground'
          )}
        >
          {paragraphs.map((paragraph, idx) => (
            <p
              key={idx}
              className={cn(
                idx === 0 && 'text-xl font-semibold' // Lead paragraph
              )}
            >
              {paragraph}
            </p>
          ))}
        </article>
      </CardContent>
    </Card>
  )
}
