'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Database } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { DataTable } from '@/components/datatable/data-table';
import { createTableColumns } from '@/components/datatable/tables-columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params using useMemo to avoid cascading renders
  const { databases, connectionInfo } = useMemo(() => {
    const dbData = searchParams.get('databases');
    const hostname = searchParams.get('hostname');
    const username = searchParams.get('username');
    const networkType = searchParams.get('networkType');

    if (!dbData || !hostname || !username || !networkType) {
      return {
        databases: [],
        connectionInfo: { hostname: '', username: '', networkType: '' },
      };
    }

    try {
      const parsedDatabases = JSON.parse(decodeURIComponent(dbData));
      return {
        databases: parsedDatabases,
        connectionInfo: { hostname, username, networkType },
      };
    } catch (error) {
      console.error('Error parsing database data:', error);
      return {
        databases: [],
        connectionInfo: { hostname: '', username: '', networkType: '' },
      };
    }
  }, [searchParams]);

  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(
    databases.length > 0 ? databases[0].name : null
  );
  const [tableDetails, setTableDetails] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [newTableName, setNewTableName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if no valid data
    if (databases.length === 0) {
      router.push('/');
    }
  }, [databases, router]);

  // Fetch table details when database is selected
  useEffect(() => {
    if (!selectedDatabase) return;

    const fetchTableDetails = async () => {
      setLoadingTables(true);
      try {
        const response = await fetch('/api/get-tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            networkType: connectionInfo.networkType,
            hostname: connectionInfo.hostname,
            username: connectionInfo.username,
            password: searchParams.get('password') || '',
            port:
              searchParams.get('port') ||
              (connectionInfo.networkType === 'mysql' ? '3306' : '5432'),
            database: selectedDatabase,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setTableDetails(data.tables || []);
        }
      } catch (error) {
        console.error('Error fetching table details:', error);
        setTableDetails([]);
      } finally {
        setLoadingTables(false);
      }
    };

    fetchTableDetails();
  }, [selectedDatabase, connectionInfo, searchParams]);

  const handleDisconnect = () => {
    router.push('/');
  };

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
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/export-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkType: connectionInfo.networkType,
          hostname: connectionInfo.hostname,
          username: connectionInfo.username,
          password: searchParams.get('password') || '',
          port:
            searchParams.get('port') ||
            (connectionInfo.networkType === 'mysql' ? '3306' : '5432'),
          database: selectedDatabase,
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
        toast.success(`Exported ${tableName} as ${format.toUpperCase()}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to export table');
      }
    } catch (error) {
      console.error('Error exporting table:', error);
      toast.error('Failed to export table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameSubmit = async () => {
    if (!newTableName.trim() || newTableName === selectedTable) {
      setIsEditDialogOpen(false);
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
          password: searchParams.get('password') || '',
          port:
            searchParams.get('port') ||
            (connectionInfo.networkType === 'mysql' ? '3306' : '5432'),
          database: selectedDatabase,
          oldTableName: selectedTable,
          newTableName: newTableName.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Table renamed to ${newTableName}`);
        setIsEditDialogOpen(false);
        // Refresh table list
        const fetchResponse = await fetch('/api/get-tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            networkType: connectionInfo.networkType,
            hostname: connectionInfo.hostname,
            username: connectionInfo.username,
            password: searchParams.get('password') || '',
            port:
              searchParams.get('port') ||
              (connectionInfo.networkType === 'mysql' ? '3306' : '5432'),
            database: selectedDatabase,
          }),
        });
        const fetchData = await fetchResponse.json();
        if (fetchData.success) {
          setTableDetails(fetchData.tables || []);
        }
      } else {
        toast.error(data.error || 'Failed to rename table');
      }
    } catch (error) {
      console.error('Error renaming table:', error);
      toast.error('Failed to rename table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/delete-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          networkType: connectionInfo.networkType,
          hostname: connectionInfo.hostname,
          username: connectionInfo.username,
          password: searchParams.get('password') || '',
          port:
            searchParams.get('port') ||
            (connectionInfo.networkType === 'mysql' ? '3306' : '5432'),
          database: selectedDatabase,
          tableName: selectedTable,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Table ${selectedTable} deleted`);
        setIsDeleteDialogOpen(false);
        // Refresh table list
        const fetchResponse = await fetch('/api/get-tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            networkType: connectionInfo.networkType,
            hostname: connectionInfo.hostname,
            username: connectionInfo.username,
            password: searchParams.get('password') || '',
            port:
              searchParams.get('port') ||
              (connectionInfo.networkType === 'mysql' ? '3306' : '5432'),
            database: selectedDatabase,
          }),
        });
        const fetchData = await fetchResponse.json();
        if (fetchData.success) {
          setTableDetails(fetchData.tables || []);
        }
      } else {
        toast.error(data.error || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(
    () =>
      createTableColumns({
        onEdit: handleEditTable,
        onDelete: handleDeleteTable,
        onExport: handleExportTable,
      }),
    []
  );

  return (
    <div className='[--header-height:calc(--spacing(14))]'>
      <SidebarProvider className='flex flex-col'>
        <SiteHeader selectedDatabase={selectedDatabase} />
        <div className='flex flex-1'>
          <AppSidebar
            databases={databases}
            connectionInfo={connectionInfo}
            selectedDatabase={selectedDatabase}
            onSelectDatabase={setSelectedDatabase}
            onDisconnect={handleDisconnect}
          />
          <SidebarInset>
            <div className='flex flex-1 flex-col gap-4 p-4'>
              {selectedDatabase ? (
                <>
                  <div className='grid auto-rows-min gap-4 md:grid-cols-3'>
                    <Card>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-sm font-medium'>
                          Database Size
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-bold'>
                          {
                            databases.find(
                              (db: { name: string; size: string }) =>
                                db.name === selectedDatabase
                            )?.size
                          }
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-sm font-medium'>
                          Connection Type
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='text-2xl font-bold capitalize'>
                          {connectionInfo.networkType}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className='pb-3'>
                        <CardTitle className='text-sm font-medium'>
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='flex items-center gap-2'>
                          <div className='h-2 w-2 rounded-full bg-green-500' />
                          <span className='text-2xl font-bold'>Connected</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className='min-h-screen flex-1 md:min-h-min'>
                    {loadingTables ? (
                      <Card>
                        <CardContent className='pt-6'>
                          <div className='flex items-center justify-center p-8'>
                            <div className='text-center'>
                              <Database className='mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse' />
                              <p className='text-sm text-muted-foreground'>
                                Loading tables...
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <DataTable
                        columns={columns}
                        data={tableDetails}
                        searchKey='name'
                        searchPlaceholder='Filter tables...'
                      />
                    )}
                  </div>

                  {/* Edit Dialog */}
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rename Table</DialogTitle>
                        <DialogDescription>
                          Enter a new name for the table "{selectedTable}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className='grid gap-4 py-4'>
                        <div className='grid gap-2'>
                          <Label htmlFor='newTableName'>New Table Name</Label>
                          <Input
                            id='newTableName'
                            value={newTableName}
                            onChange={(e) => setNewTableName(e.target.value)}
                            placeholder='Enter new table name'
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
                          onClick={handleRenameSubmit}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Renaming...' : 'Rename'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Dialog */}
                  <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Table</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete the table "
                          {selectedTable}"? This action cannot be undone.
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
                          onClick={handleDeleteSubmit}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Deleting...' : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className='bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min flex items-center justify-center'>
                  <div className='text-center'>
                    <Database className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
                    <h3 className='text-lg font-medium mb-2'>
                      No Database Selected
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Select a database from the sidebar to get started
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
