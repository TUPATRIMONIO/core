'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Sparkles, 
  Send, 
  X, 
  Check, 
  RotateCcw, 
  Type, 
  AlignLeft, 
  FileText, 
  Wand2,
  Loader2,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { InsufficientCreditsAlert } from '@/components/billing/InsufficientCreditsAlert';

interface AIAssistantOverlayProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  selection?: { text: string; from: number; to: number } | null;
  documentId: string;
}

const QUICK_ACTIONS = [
  { id: 'improve', label: 'Mejorar redacción', icon: Wand2, prompt: 'Mejora la redacción de este texto para que sea más profesional y claro.' },
  { id: 'formal', label: 'Más formal', icon: Type, prompt: 'Reescribe este texto con un tono más formal y jurídico.' },
  { id: 'shorten', label: 'Acortar', icon: AlignLeft, prompt: 'Resume este texto manteniendo los puntos clave.' },
  { id: 'extrapolate', label: 'Continuar', icon: FileText, prompt: 'Continúa escribiendo a partir de este punto siguiendo el mismo tono y estilo.' },
];

export function AIAssistantOverlay({
  editor,
  isOpen,
  onClose,
  selection,
  documentId,
}: AIAssistantOverlayProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  
  // Credit state
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditCost, setCreditCost] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [documentOrgId, setDocumentOrgId] = useState<string | null>(null);

  // Fetch credit info when overlay opens - uses document's organization, not user context
  const fetchCreditInfo = useCallback(async () => {
    if (!documentId) {
      console.warn('[AIAssistant] No documentId available');
      return;
    }
    
    setIsLoadingCredits(true);
    try {
      // First, get the document's organization_id
      const { data: docOrgId, error: orgError } = await supabase.rpc('get_document_organization_id', {
        p_document_id: documentId,
      });
      
      if (orgError || !docOrgId) {
        console.error('[AIAssistant] Error getting document org:', orgError);
        return;
      }
      
      console.log('[AIAssistant] Document org:', docOrgId);
      setDocumentOrgId(docOrgId);
      
      // Fetch balance using document's organization
      const { data: balance, error: balanceError } = await supabase.rpc('get_balance', {
        org_id_param: docOrgId,
      });
      
      console.log('[AIAssistant] Balance response:', { balance, error: balanceError });
      
      if (balanceError) {
        console.error('[AIAssistant] Balance error:', balanceError);
      } else {
        setCreditBalance(Number(balance ?? 0));
      }
      
      // Fetch cost
      const { data: prices, error: priceError } = await supabase
        .from('credit_prices')
        .select('credit_cost')
        .eq('service_code', 'ai_editor_assistance')
        .limit(1);
      
      if (!priceError && prices?.length) {
        const cost = Number(prices[0]?.credit_cost ?? 0);
        setCreditCost(cost > 0 ? cost : null);
      }
    } catch (err) {
      console.error('[AIAssistant] Error fetching credit info:', err);
    } finally {
      setIsLoadingCredits(false);
    }
  }, [documentId, supabase]);

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setResult(null);
      setIsLoading(false);
    } else {
      // Fetch credit info when opening
      fetchCreditInfo();
    }
  }, [isOpen, fetchCreditInfo]);

  if (!isOpen) return null;
  
  const canUseAi = creditBalance !== null && creditCost !== null && creditBalance >= creditCost;

  const handleGenerate = async (explicitPrompt?: string) => {
    const finalPrompt = explicitPrompt || prompt;
    if (!finalPrompt.trim() || !editor) return;
    
    if (!canUseAi) {
      toast.error('Créditos insuficientes para usar la IA');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('document-ai-assistant', {
        body: {
          document_id: documentId,
          document_content: editor.getText(),
          selected_text: selection?.text || '',
          user_instruction: finalPrompt,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Error desconocido');

      setResult(data.suggestion);
      
      // Refresh balance after use
      if (documentOrgId) {
        const { data: newBalance } = await supabase.rpc('get_balance', {
          org_id_param: documentOrgId,
        });
        if (typeof newBalance === 'number') {
          setCreditBalance(newBalance);
          toast.success(`Sugerencia generada. Créditos restantes: ${newBalance.toFixed(1)}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('AI Assistant error:', error);
      toast.error('Error al generar sugerencia: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper simple para convertir Markdown básico a HTML
   * Maneja: **negritas**, *cursivas*, y saltos de línea
   */
  const markdownToHtml = (markdown: string) => {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Split by double newline for paragraphs
      .split('\n\n')
      .map(p => {
        // Replace single newline with break within paragraph
        const content = p.replace(/\n/g, '<br />');
        return `<p>${content}</p>`;
      })
      .join('');
  };

  const handleApply = () => {
    if (!editor || !result) return;
    
    // Convert markdown to HTML before inserting
    const htmlContent = markdownToHtml(result);

    if (selection) {
      // Reemplazar selección
      editor.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, htmlContent).run();
    } else {
      // Insertar al final o en cursor
      editor.chain().focus().insertContent(htmlContent).run();
    }
    
    toast.success('Cambios aplicados');
    onClose();
  };

  const clearResult = () => {
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card ref={containerRef} className="w-full max-w-2xl shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md overflow-hidden flex flex-col max-h-[80vh]">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-4 shrink-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Asistente con IA
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Credit Info Badge */}
            {!isLoadingCredits && creditBalance !== null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                <Coins className="h-3.5 w-3.5" />
                <span className="font-medium">{creditBalance.toFixed(1)}</span>
                <span>créditos</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
          {!result ? (
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Credit Cost Info */}
                {creditCost !== null && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4 text-primary" />
                      <span>Costo por solicitud:</span>
                      <span className="font-semibold text-primary">{creditCost}</span>
                      <span className="text-muted-foreground">créditos</span>
                    </div>
                    {creditBalance !== null && (
                      <div className="text-xs text-muted-foreground">
                        Saldo: <span className="font-medium">{creditBalance.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Insufficient credits warning */}
                {!canUseAi && creditBalance !== null && creditCost !== null && (
                  <InsufficientCreditsAlert
                    currentBalance={creditBalance}
                    requiredCredits={creditCost}
                    variant="inline"
                    onCreditsAdded={fetchCreditInfo}
                  />
                )}
                
                {/* Input Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground italic">
                    {selection ? '¿Qué quieres hacer con el texto seleccionado?' : '¿En qué puedo ayudarte con este documento?'}
                  </label>
                  <div className="relative group">
                    <Input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Escribe una instrucción (ej: 'redacta una clausula de confidencialidad', 'hazlo más formal'...)"
                      className="pr-12 h-12 text-base border-primary/20 focus-visible:ring-primary shadow-inner"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                      autoFocus
                      disabled={!canUseAi}
                    />
                    <Button 
                      size="icon" 
                      className="absolute right-1.5 top-1.5 h-9 w-9"
                      onClick={() => handleGenerate()}
                      disabled={isLoading || !prompt.trim() || !canUseAi}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones rápidas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Button
                        key={action.id}
                        variant="outline"
                        className="justify-start gap-4 h-auto py-3 px-4 text-left hover:border-primary/50 hover:bg-primary/5 group"
                        onClick={() => {
                          setPrompt(action.prompt);
                          handleGenerate(action.prompt);
                        }}
                        disabled={isLoading || !canUseAi}
                      >
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{action.label}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1 opacity-70">Basado en tu selección</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Context Info */}
                {selection && (
                  <div className="p-3 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
                    <span className="font-semibold block mb-1">Contexto seleccionado:</span>
                    <p className="line-clamp-2 italic">"{selection.text}"</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom-5 duration-300">
              <div className="p-3 bg-primary/5 border-b flex items-center justify-between shrink-0">
                <span className="text-xs font-medium text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Sugerencia generada
                </span>
                <div className="flex items-center gap-2">
                  {creditBalance !== null && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      Saldo: {creditBalance.toFixed(1)}
                    </span>
                  )}
                  <Badge variant="outline" className="text-[10px] uppercase">Borrador</Badge>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {/* Renderizado como HTML para mostrar negritas, etc */}
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(result) }}
                  />
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t bg-muted/20 py-3 flex justify-between gap-3 shrink-0">
          {!result ? (
            <div className="text-[11px] text-muted-foreground italic flex items-center gap-1.5 opacity-70">
              <Sparkles className="h-3 w-3" /> 
              Usa la IA para redactar, corregir o extender tu documento
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={clearResult} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Volver
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Descartar
                </Button>
                <Button variant="default" size="sm" onClick={handleApply} className="gap-2 bg-primary hover:bg-primary/90">
                  <Check className="h-4 w-4" />
                  Aplicar al documento
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

