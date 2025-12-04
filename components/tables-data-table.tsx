'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Database,
  SearchX,
  Plus,
  Edit,
  Trash2,
  Download,
} from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  created: string;
  updated: string;
  engine: string;
  comment: string;
  type: string;
}

interface TablesDataTableProps {
  tables: TableInfo[];
  databaseName: string;
  onRefresh?: () => void;
  connectionInfo?: {
    networkType: string;
    hostname: string;
    username: string;
    password?: string;
    port?: string;
  };
}

export function TablesDataTable({
  tables,
  databaseName,
  onRefresh,
  connectionInfo,
}: TablesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [newTableName, setNewTableName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditTable = (tableName: string) => {
    setSelectedTable(tableName);
    setNewTableName(tableName);
    setIsEditDialogOpen(true);
  };

  const handleDeleteTable = (tableName: string) => {
    setSelectedTable(tableName);
    setIsDeleteDialogOpen(true);
  };

  const handleExportTable = async (
    tableName: string,
    format: 'csv' | 'json' | 'sql'
  ) => {
    if (!connectionInfo) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/export-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkType: connectionInfo.networkType,
          hostname: connectionInfo.hostname,
          username: connectionInfo.username,
          password: connectionInfo.password || '',
          port: connectionInfo.port,
          database: databaseName,
          tableName: tableName,
          format: format,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to export table');
      }
    } catch (error) {
      console.error('Error exporting table:', error);
      alert('Failed to export table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmEditTable = async () => {
    if (!newTableName.trim() || !connectionInfo) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/rename-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkType: connectionInfo.networkType,
          hostname: connectionInfo.hostname,
          username: connectionInfo.username,
          password: connectionInfo.password || '',
          port: connectionInfo.port,
          database: databaseName,
          oldTableName: selectedTable,
          newTableName: newTableName.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditDialogOpen(false);
        setNewTableName('');
        setSelectedTable('');
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to rename table');
      }
    } catch (error) {
      console.error('Error renaming table:', error);
      alert('Failed to rename table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteTable = async () => {
    if (!connectionInfo) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/delete-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkType: connectionInfo.networkType,
          hostname: connectionInfo.hostname,
          username: connectionInfo.username,
          password: connectionInfo.password || '',
          port: connectionInfo.port,
          database: databaseName,
          tableName: selectedTable,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteDialogOpen(false);
        setSelectedTable('');
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tables based on debounced search query
  const filteredTables = useMemo(() => {
    if (!debouncedSearch.trim()) return tables;

    const query = debouncedSearch.toLowerCase();
    return tables.filter(
      (table) =>
        table.name.toLowerCase().includes(query) ||
        table.comment?.toLowerCase().includes(query) ||
        table.type.toLowerCase().includes(query) ||
        table.engine.toLowerCase().includes(query)
    );
  }, [tables, debouncedSearch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tables in {databaseName}</CardTitle>
        <CardDescription>
          {filteredTables.length} table{filteredTables.length !== 1 ? 's' : ''}{' '}
          {searchQuery ? 'found' : 'total'}
        </CardDescription>
        <div className='relative mt-4'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search tables by name, comment, type, or engine...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {filteredTables.length === 0 ? (
          <Empty className='my-8'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                {searchQuery ? <SearchX /> : <Database />}
              </EmptyMedia>
              <EmptyTitle>
                {searchQuery ? 'No tables found' : 'No tables'}
              </EmptyTitle>
              {searchQuery && (
                <EmptyDescription>
                  No tables match your search criteria. Try adjusting your
                  search terms.
                </EmptyDescription>
              )}
            </EmptyHeader>
            <EmptyContent>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className='h-4 w-4' />
                    Create Table
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Table</DialogTitle>
                    <DialogDescription>
                      Create a new table in {databaseName} database.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-2'>
                      <label
                        htmlFor='tableName'
                        className='text-sm font-medium'
                      >
                        Table Name
                      </label>
                      <Input
                        id='tableName'
                        placeholder='Enter table name'
                        value={tableName}
                        onChange={(e) => setTableName(e.target.value)}
                      />
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Note: This feature is coming soon. Table creation
                      functionality will be available in a future update.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button disabled>Create Table</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </EmptyContent>
          </Empty>
        ) : (
          <ScrollArea className='h-[600px]'>
            <Table>
              {/* fix header */}
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <ContextMenu key={table.name}>
                    <ContextMenuTrigger asChild>
                      <TableRow className='cursor-context-menu'>
                        <TableCell className='font-medium'>
                          {table.name}
                        </TableCell>
                        <TableCell>{table.rows}</TableCell>
                        <TableCell>{table.size}</TableCell>
                        <TableCell className='text-sm'>
                          {new Date(table.created).toLocaleString()}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {new Date(table.updated).toLocaleString()}
                        </TableCell>
                        <TableCell>{table.engine}</TableCell>
                        <TableCell
                          className='max-w-xs truncate'
                          title={table.comment}
                        >
                          {table.comment || '-'}
                        </TableCell>
                        <TableCell>{table.type}</TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent className='w-52'>
                      <ContextMenuItem
                        onClick={() => handleEditTable(table.name)}
                      >
                        <Edit className='h-4 w-4' />
                        <span>Edit Table</span>
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          <Download className='h-4 w-4' />
                          <span>Export Table</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          <ContextMenuItem
                            onClick={() => handleExportTable(table.name, 'csv')}
                          >
                            Export as CSV
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() =>
                              handleExportTable(table.name, 'json')
                            }
                          >
                            Export as JSON
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleExportTable(table.name, 'sql')}
                          >
                            Export as SQL
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuItem
                        variant='destructive'
                        onClick={() => handleDeleteTable(table.name)}
                      >
                        <Trash2 className='h-4 w-4' />
                        <span>Delete Table</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table Name</DialogTitle>
            <DialogDescription>
              {`Rename the table "${selectedTable}" in ${databaseName} database.`}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label htmlFor='newTableName' className='text-sm font-medium'>
                New Table Name
              </label>
              <Input
                id='newTableName'
                placeholder='Enter new table name'
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEditTable}
              disabled={!newTableName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Renaming...' : 'Rename Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              {`Are you sure you want to delete the table "${selectedTable}"? This
              action cannot be undone and all data will be permanently lost.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDeleteTable}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
