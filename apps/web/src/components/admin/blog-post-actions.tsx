'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteBlogPost, togglePublishBlogPost } from '@/lib/admin/blog-actions'

interface BlogPostActionsProps {
  postId: string
}

export function BlogPostActions({ postId }: BlogPostActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteBlogPost(postId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Error al eliminar el post. Por favor, intenta nuevamente.')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleTogglePublish = async () => {
    try {
      const result = await togglePublishBlogPost(postId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Error al actualizar el post. Por favor, intenta nuevamente.')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/blog/${postId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTogglePublish}>
            <Eye className="h-4 w-4 mr-2" />
            Publicar/Despublicar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El post será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
