'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Link, Loader2, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ShareDocumentDialogProps {
  documentId: string;
  isPublic?: boolean;
  publicToken?: string;
  publicAccessLevel?: 'view' | 'comment';
}

export function ShareDocumentDialog({
  documentId,
  isPublic = false,
  publicToken,
  publicAccessLevel = 'comment',
}: ShareDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(isPublic);
  const [shareToken, setShareToken] = useState(publicToken);
  const [accessLevel, setAccessLevel] = useState<'view' | 'comment'>(publicAccessLevel);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();
  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : '';

  async function handleToggleSharing(enabled: boolean) {
    setIsLoading(true);
    try {
      if (enabled) {
        const { data, error } = await supabase.rpc('enable_document_public_sharing', {
          p_document_id: documentId,
          p_access_level: accessLevel,
          p_require_email: true,
        });

        if (error) throw error;
        
        setShareToken(data.token);
        setIsSharing(true);
        toast.success('Link público creado');
      } else {
        const { error } = await supabase.rpc('disable_document_public_sharing', {
          p_document_id: documentId,
        });

        if (error) throw error;
        
        setShareToken(undefined);
        setIsSharing(false);
        toast.success('Link público desactivado');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cambiar configuración');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir Documento</DialogTitle>
          <DialogDescription>
            Permite que personas externas vean y comenten el documento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Toggle compartir */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar link público</Label>
              <p className="text-sm text-muted-foreground">
                Cualquiera con el link puede acceder
              </p>
            </div>
            <Switch
              checked={isSharing}
              onCheckedChange={handleToggleSharing}
              disabled={isLoading}
            />
          </div>

          {isSharing && (
            <>
              {/* Nivel de acceso */}
              <div className="space-y-3">
                <Label>Permisos de acceso</Label>
                <RadioGroup
                  value={accessLevel}
                  onValueChange={(v) => setAccessLevel(v as 'view' | 'comment')}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="view" id="view" />
                    <Label htmlFor="view" className="flex items-center gap-2 font-normal cursor-pointer">
                      <Eye className="h-4 w-4" />
                      Solo ver
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comment" id="comment" />
                    <Label htmlFor="comment" className="flex items-center gap-2 font-normal cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      Ver y comentar
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Link para copiar */}
              <div className="space-y-2">
                <Label>Link para compartir</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    disabled={!shareUrl}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los visitantes deberán ingresar su email para acceder
                </p>
              </div>
            </>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
