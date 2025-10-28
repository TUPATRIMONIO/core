/**
 * Gestión de Categorías de Blog
 * CRUD completo para categorías con colores y ordenamiento
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useBlogManagement, generateSlug, type BlogCategory } from '@/hooks/useBlogManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export function CategoryManagement() {
  const {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isAdmin
  } = useBlogManagement();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<BlogCategory>>({
    name: '',
    slug: '',
    description: '',
    color: '#800039',
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#800039',
      is_active: true
    });
    setIsEditing(null);
    setIsCreating(false);
    setErrorMessage(null);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (category: BlogCategory) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      is_active: category.is_active
    });
    setIsEditing(category.id);
    setIsCreating(false);
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: isCreating ? generateSlug(name) : formData.slug
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      setErrorMessage('El nombre y slug son requeridos');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      let result;

      if (isEditing) {
        result = await updateCategory(isEditing, formData);
      } else {
        result = await createCategory(formData);
      }

      if (result.success) {
        showSuccess(
          isEditing
            ? 'Categoría actualizada exitosamente'
            : 'Categoría creada exitosamente'
        );
        resetForm();
        await fetchCategories();
      } else {
        setErrorMessage(result.error || 'Error al guardar categoría');
      }
    } catch (err) {
      setErrorMessage('Error inesperado al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;

    const result = await deleteCategory(id);

    if (result.success) {
      showSuccess('Categoría eliminada exitosamente');
      await fetchCategories();
    } else {
      setErrorMessage(result.error || 'Error al eliminar categoría');
    }
  };

  const handleToggleActive = async (category: BlogCategory) => {
    const result = await updateCategory(category.id, {
      ...category,
      is_active: !category.is_active
    });

    if (result.success) {
      await fetchCategories();
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para gestionar categorías
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tp-buttons)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorías del Blog</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organiza el contenido del blog en categorías
          </p>
        </div>
        <Button
          onClick={handleStartCreate}
          disabled={isCreating}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form para crear/editar */}
      {(isCreating || isEditing) && (
        <Card className="border-[var(--tp-buttons)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Firma Electrónica"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="firma-electronica"
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descripción de la categoría"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#800039"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">Estado</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      {formData.is_active ? 'Activa' : 'Inactiva'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formData.name || !formData.slug}
                  className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category.id, category.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.description && (
                <p className="text-sm text-gray-600">{category.description}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {category.post_count || 0} posts
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={() => handleToggleActive(category)}
                  />
                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                    {category.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && !isCreating && (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay categorías
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Crea tu primera categoría para organizar los posts del blog
            </p>
            <Button
              onClick={handleStartCreate}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Categoría
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

