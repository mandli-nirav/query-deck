'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2, Download } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from './data-table-column-header';

export type TableInfo = {
  name: string;
  rows: number;
  size: string;
  created: string;
  updated: string;
  engine: string;
  comment: string;
  type: string;
};

interface CreateColumnsProps {
  onEdit: (tableName: string) => void;
  onDelete: (tableName: string) => void;
  onExport: (tableName: string, format: 'csv' | 'json' | 'sql') => void;
}

export function createTableColumns({
  onEdit,
  onDelete,
  onExport,
}: CreateColumnsProps): ColumnDef<TableInfo>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Table Name' />
      ),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'rows',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Rows' />
      ),
      cell: ({ row }) => (
        <div className='text-right'>
          {row.getValue<number>('rows').toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'size',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Size' />
      ),
    },
    {
      accessorKey: 'engine',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Engine' />
      ),
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Type' />
      ),
      cell: ({ row }) => (
        <div className='capitalize'>{row.getValue('type')}</div>
      ),
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Created' />
      ),
      cell: ({ row }) => {
        const dateValue = row.getValue<string>('created');
        let formattedDate = dateValue;

        try {
          const parsedDate = parseISO(dateValue);
          if (isValid(parsedDate)) {
            formattedDate = format(parsedDate, 'MMM dd, yyyy HH:mm');
          }
        } catch (error) {
          console.log(error);
          // Keep original value if parsing fails
        }

        return (
          <div className='text-sm text-muted-foreground'>{formattedDate}</div>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const table = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(table.name)}>
                <Edit />
                Rename table
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download />
                  Export
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onExport(table.name, 'csv')}>
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onExport(table.name, 'json')}
                  >
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport(table.name, 'sql')}>
                    Export as SQL
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(table.name)}
                className='text-destructive'
              >
                <Trash2 />
                Delete table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
