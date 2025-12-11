'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCorners,
} from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
}

export interface KanbanCardProps<T> {
  item: T;
  isOverlay?: boolean;
}

interface RecordKanbanViewProps<T extends { id: string }> {
  records: T[];
  columns: KanbanColumn[];
  /** Function to get the column ID for a record */
  getRecordColumn: (record: T) => string;
  /** Callback when a record is moved to a different column */
  onColumnChange?: (recordId: string, newColumnId: string, oldColumnId: string) => Promise<{ success: boolean }>;
  /** Custom card renderer */
  renderCard: (item: T, isOverlay?: boolean) => React.ReactNode;
  /** Minimum height for columns */
  minColumnHeight?: string;
}

function DraggableCard<T extends { id: string }>({ 
  item, 
  renderCard,
  isOverlay = false 
}: { 
  item: T; 
  renderCard: (item: T, isOverlay?: boolean) => React.ReactNode;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item },
    disabled: isOverlay,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`mb-3 ${isDragging ? 'opacity-50' : ''}`}
    >
      {renderCard(item, isOverlay)}
    </div>
  );
}

function KanbanColumnComponent<T extends { id: string }>({ 
  column, 
  items,
  renderCard,
  minHeight = '500px',
}: { 
  column: KanbanColumn; 
  items: T[];
  renderCard: (item: T, isOverlay?: boolean) => React.ReactNode;
  minHeight?: string;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-1 min-w-[280px] h-full flex flex-col">
      <div className={`p-3 rounded-t-md border-b-2 font-medium flex justify-between items-center bg-background/50 backdrop-blur-sm ${column.color}`}>
        <span>{column.label}</span>
        <Badge variant="secondary" className="text-xs">
          {items.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 bg-muted/30 p-2 rounded-b-md border border-t-0 border-border overflow-y-auto"
        style={{ minHeight }}
      >
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} renderCard={renderCard} />
        ))}
      </div>
    </div>
  );
}

/**
 * A reusable Kanban board view component with drag-and-drop functionality.
 * Supports configurable columns and custom card rendering.
 */
export function RecordKanbanView<T extends { id: string }>({
  records: initialRecords,
  columns,
  getRecordColumn,
  onColumnChange,
  renderCard,
  minColumnHeight = '500px',
}: RecordKanbanViewProps<T>) {
  const [records, setRecords] = useState<T[]>(initialRecords);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id && over.id && onColumnChange) {
      const recordId = active.id as string;
      const newColumnId = over.id as string;

      const record = records.find(r => r.id === recordId);
      if (record) {
        const oldColumnId = getRecordColumn(record);
        
        if (oldColumnId !== newColumnId) {
          const result = await onColumnChange(recordId, newColumnId, oldColumnId);
          if (!result.success) {
            toast.error('Error al actualizar');
          } else {
            toast.success('Estado actualizado');
          }
        }
      }
    }

    setActiveId(null);
  };

  const activeRecord = activeId ? records.find((r) => r.id === activeId) : null;

  const getItemsForColumn = (columnId: string) => {
    return records.filter(record => getRecordColumn(record) === columnId);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
        {columns.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            items={getItemsForColumn(column.id)}
            renderCard={renderCard}
            minHeight={minColumnHeight}
          />
        ))}
      </div>

      <DragOverlay>
        {activeRecord ? (
          <div className="shadow-[0_20px_50px_rgba(0,0,0,0.25)] cursor-grabbing">
            {renderCard(activeRecord, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default RecordKanbanView;
