'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export interface ColumnDefinition<T> {
  id: string;
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  /** If true, this column is hidden on mobile */
  hideOnMobile?: boolean;
}

export interface RowAction<T> {
  label: string;
  href?: string | ((item: T) => string);
  onClick?: (item: T) => void;
  icon?: React.ReactNode;
}

interface RecordListViewProps<T extends { id: string }> {
  records: T[];
  columns: ColumnDefinition<T>[];
  /** URL pattern for row click, e.g., '/admin/items/{id}' - {id} will be replaced */
  rowHref?: string | ((record: T) => string);
  /** Actions shown in dropdown menu per row */
  rowActions?: RowAction<T>[];
  emptyMessage?: string;
  isLoading?: boolean;
  /** Key field for unique identification (defaults to 'id') */
  keyField?: keyof T;
}

/**
 * A reusable list/table view component for displaying records.
 * Supports configurable columns, row actions, and click navigation.
 */
export function RecordListView<T extends { id: string }>({
  records,
  columns,
  rowHref,
  rowActions,
  emptyMessage = 'No se encontraron registros.',
  isLoading = false,
  keyField = 'id',
}: RecordListViewProps<T>) {
  const getHref = (record: T): string | undefined => {
    if (!rowHref) return undefined;
    if (typeof rowHref === 'function') return rowHref(record);
    return rowHref.replace('{id}', String(record.id));
  };

  const getCellValue = (record: T, column: ColumnDefinition<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(record);
    }
    return record[column.accessor] as React.ReactNode;
  };

  if (records.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.id}
                className={`${column.className || ''} ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
              >
                {column.header}
              </TableHead>
            ))}
            {rowActions && rowActions.length > 0 && (
              <TableHead className="w-[50px]"></TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const href = getHref(record);
            return (
              <TableRow 
                key={String(record[keyField])}
                className={href ? 'cursor-pointer hover:bg-muted/50' : ''}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.id}
                    className={`${column.className || ''} ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  >
                    {getCellValue(record, column)}
                  </TableCell>
                ))}
                {rowActions && rowActions.length > 0 && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {rowActions.map((action, index) => {
                          const actionHref = typeof action.href === 'function' 
                            ? action.href(record) 
                            : action.href;
                          
                          if (actionHref) {
                            return (
                              <DropdownMenuItem key={index} asChild>
                                <Link href={actionHref}>
                                  {action.icon}
                                  {action.label}
                                </Link>
                              </DropdownMenuItem>
                            );
                          }
                          
                          return (
                            <DropdownMenuItem 
                              key={index} 
                              onClick={() => action.onClick?.(record)}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default RecordListView;
