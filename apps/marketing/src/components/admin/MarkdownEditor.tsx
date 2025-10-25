'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Eye, Code } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('edit')}
          >
            <Code className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('preview')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
        <span className="text-sm text-gray-500">
          {value.length} caracteres
        </span>
      </div>

      <Separator />

      {mode === 'edit' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el contenido del post en Markdown..."
          rows={20}
          className="font-mono text-sm"
        />
      ) : (
        <div className="min-h-[500px] p-4 border rounded-md bg-white">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: value
                .replace(/\n/g, '<br />')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
                .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            }}
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        Soporta Markdown: **negrita**, *cursiva*, `código`, # títulos
      </p>
    </div>
  )
}

