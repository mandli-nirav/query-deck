'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { Play, Download, Trash2, Copy } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { editor } from 'monaco-editor';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

function PlaygroundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [query, setQuery] = useState('SELECT * FROM your_table LIMIT 10;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [tableSchemas, setTableSchemas] = useState<Record<string, string[]>>(
    {}
  );
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const completionProviderRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    if (databases.length > 0 && !selectedDatabase) {
      setSelectedDatabase(databases[0].name);
    }
  }, [databases, selectedDatabase]);

  useEffect(() => {
    if (databases.length === 0) {
      router.push('/');
    }
  }, [databases, router]);

  // Fetch table names and schemas for autocomplete
  useEffect(() => {
    if (!selectedDatabase) return;

    const fetchTableInfo = async () => {
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
        if (data.success && data.tables) {
          const names = data.tables.map((t: any) => t.name);
          setTableNames(names);

          // Fetch columns for each table
          const schemas: Record<string, string[]> = {};
          for (const table of data.tables) {
            const colResponse = await fetch('/api/get-columns', {
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
                tableName: table.name,
              }),
            });

            const colData = await colResponse.json();
            if (colData.success && colData.columns) {
              schemas[table.name] = colData.columns.map((c: any) => c.name);
            }
          }
          setTableSchemas(schemas);
        }
      } catch (error) {
        console.error('Error fetching table info:', error);
      }
    };

    fetchTableInfo();
  }, [selectedDatabase, connectionInfo, searchParams]);

  const handleDisconnect = () => {
    router.push('/');
  };

  const executeQuery = async (queryToExecute?: string) => {
    const queryText = queryToExecute ?? query;

    if (!queryText.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setQueryResult(null);

    try {
      const response = await fetch('/api/execute-query', {
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
          query: queryText.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQueryResult(data.result);
        toast.success(
          `Query executed successfully (${data.result.rowCount} rows)`
        );
      } else {
        setError(data.error || 'Query execution failed');
        toast.error(data.error || 'Query execution failed');
      }
    } catch (error) {
      console.error('Error executing query:', error);
      setError('Failed to execute query');
      toast.error('Failed to execute query');
    } finally {
      setIsExecuting(false);
    }
  };

  const clearEditor = () => {
    setQuery('');
    setQueryResult(null);
    setError(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(query);
    toast.success('Query copied to clipboard');
  };

  const exportResults = () => {
    if (!queryResult) return;

    const csv = [
      queryResult.columns.join(','),
      ...queryResult.rows.map((row) =>
        queryResult.columns
          .map((col) => {
            const value = row[col];
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Results exported as CSV');
  };

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add keyboard shortcut for Ctrl+Enter to execute query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Get current editor content directly to ensure latest value
      const currentQuery = editor.getValue();
      executeQuery(currentQuery);
    });

    // Dispose previous completion provider if exists
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    // Register SQL completion provider only once
    completionProviderRef.current =
      monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions: any[] = [];

          // Database names
          databases.forEach((db: any) => {
            suggestions.push({
              label: db.name,
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: db.name,
              range: range,
              detail: 'Database',
              documentation: `Database: ${db.name} (${db.size})`,
            });
          });

          // SQL Keywords
          const keywords = [
            'SELECT',
            'FROM',
            'WHERE',
            'JOIN',
            'LEFT JOIN',
            'RIGHT JOIN',
            'INNER JOIN',
            'ORDER BY',
            'GROUP BY',
            'HAVING',
            'LIMIT',
            'OFFSET',
            'INSERT INTO',
            'UPDATE',
            'DELETE FROM',
            'CREATE TABLE',
            'ALTER TABLE',
            'DROP TABLE',
            'DISTINCT',
            'AS',
            'ON',
            'AND',
            'OR',
            'NOT',
            'IN',
            'BETWEEN',
            'LIKE',
            'IS NULL',
            'IS NOT NULL',
            'COUNT',
            'SUM',
            'AVG',
            'MAX',
            'MIN',
            'ASC',
            'DESC',
          ];

          keywords.forEach((keyword) => {
            suggestions.push({
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: keyword,
              range: range,
              detail: 'SQL Keyword',
            });
          });

          // Table names
          tableNames.forEach((tableName) => {
            suggestions.push({
              label: tableName,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: tableName,
              range: range,
              detail: 'Table',
              documentation: `Table: ${tableName}`,
            });

            // Add columns for each table
            const columns = tableSchemas[tableName] || [];
            columns.forEach((column) => {
              suggestions.push({
                label: `${tableName}.${column}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${tableName}.${column}`,
                range: range,
                detail: `Column in ${tableName}`,
                documentation: `${tableName}.${column}`,
              });
            });
          });

          // All columns (without table prefix)
          Object.entries(tableSchemas).forEach(([tableName, columns]) => {
            columns.forEach((column) => {
              suggestions.push({
                label: column,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column,
                range: range,
                detail: `Column (from ${tableName})`,
              });
            });
          });

          // Common SQL functions
          const functions = [
            'COUNT(*)',
            'SUM()',
            'AVG()',
            'MAX()',
            'MIN()',
            'NOW()',
            'CURRENT_DATE',
            'CURRENT_TIME',
            'UPPER()',
            'LOWER()',
            'CONCAT()',
            'SUBSTRING()',
            'LENGTH()',
            'TRIM()',
            'COALESCE()',
            'CAST()',
            'DATE_FORMAT()',
          ];

          functions.forEach((func) => {
            suggestions.push({
              label: func,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func,
              range: range,
              detail: 'SQL Function',
            });
          });

          // USE DATABASE snippets
          if (databases.length > 0) {
            databases.forEach((db: any) => {
              suggestions.push({
                label: `USE ${db.name}`,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: `USE ${db.name};`,
                range: range,
                detail: 'Use Database',
                documentation: `Switch to database: ${db.name}`,
              });
            });
          }

          return { suggestions };
        },
      });

    // Register MySQL language if not exists
    if (!monaco.languages.getLanguages().some((lang) => lang.id === 'mysql')) {
      monaco.languages.register({ id: 'mysql' });
      monaco.languages.setMonarchTokensProvider('mysql', {
        ...monaco.languages.getLanguages().find((lang) => lang.id === 'sql'),
      } as any);
    }

    // Register PostgreSQL language if not exists
    if (!monaco.languages.getLanguages().some((lang) => lang.id === 'pgsql')) {
      monaco.languages.register({ id: 'pgsql' });
      monaco.languages.setMonarchTokensProvider('pgsql', {
        ...monaco.languages.getLanguages().find((lang) => lang.id === 'sql'),
      } as any);
    }
  };

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
          <SidebarInset className='flex flex-col overflow-hidden'>
            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
              <h1 className='text-xl font-semibold'>SQL Playground</h1>
              <div className='ml-auto flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={copyToClipboard}
                  disabled={!query.trim()}
                >
                  <Copy className='mr-2 h-4 w-4' />
                  Copy
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={clearEditor}
                  disabled={!query.trim()}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Clear
                </Button>
                <Button
                  size='sm'
                  onClick={() => executeQuery()}
                  disabled={isExecuting || !query.trim()}
                >
                  <Play className='mr-2 h-4 w-4' />
                  {isExecuting ? 'Executing...' : 'Execute'}
                </Button>
              </div>
            </header>

            <div className='flex flex-1 flex-col gap-4 p-4 overflow-hidden'>
              <div className='flex-none'>
                <div className='rounded-lg border bg-card'>
                  <div className='flex items-center justify-between border-b px-4 py-3'>
                    <div className='flex items-center gap-2'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10'>
                        <Play className='h-4 w-4 text-primary' />
                      </div>
                      <div>
                        <h2 className='text-sm font-semibold'>Query Editor</h2>
                        <p className='text-xs text-muted-foreground'>
                          {connectionInfo.networkType.toUpperCase()} •{' '}
                          {selectedDatabase}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='h-[300px]'>
                    {isMounted && (
                      <Editor
                        height='300px'
                        defaultLanguage='sql'
                        value={query}
                        onChange={(value) => setQuery(value || '')}
                        onMount={handleEditorDidMount}
                        theme='vs-dark'
                        options={{
                          minimap: { enabled: false },
                          fontSize: 16,
                          fontFamily:
                            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          fontLigatures: true,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          suggestOnTriggerCharacters: true,
                          quickSuggestions: true,
                          wordBasedSuggestions: 'off',
                          padding: { top: 16, bottom: 16 },
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className='flex-none'>
                  <div className='rounded-lg border border-destructive bg-destructive/10 p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/20'>
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-sm font-semibold text-destructive'>
                          Query Error
                        </h3>
                        <p className='mt-1 text-sm text-destructive/90'>
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {queryResult && (
                <div className='flex-1 overflow-hidden'>
                  <div className='flex h-full flex-col rounded-lg border bg-card'>
                    <div className='flex items-center justify-between border-b px-4 py-3'>
                      <div>
                        <h2 className='text-sm font-semibold'>Results</h2>
                        <p className='text-xs text-muted-foreground'>
                          {queryResult.rowCount}{' '}
                          {queryResult.rowCount === 1 ? 'row' : 'rows'} •{' '}
                          {queryResult.executionTime}ms
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={exportResults}
                      >
                        <Download className='mr-2 h-4 w-4' />
                        Export CSV
                      </Button>
                    </div>
                    <ScrollArea className='flex-1'>
                      <div className='min-w-full inline-block align-middle'>
                        <Table>
                          <TableHeader className='sticky top-0 bg-muted/50 z-10'>
                            <TableRow>
                              {queryResult.columns.map((column) => (
                                <TableHead
                                  key={column}
                                  className='font-semibold whitespace-nowrap'
                                >
                                  {column}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {queryResult.rows.map((row, index) => (
                              <TableRow key={index}>
                                {queryResult.columns.map((column) => (
                                  <TableCell
                                    key={column}
                                    className='font-mono text-xs whitespace-nowrap'
                                  >
                                    {row[column] !== null &&
                                    row[column] !== undefined ? (
                                      String(row[column])
                                    ) : (
                                      <span className='text-muted-foreground italic'>
                                        NULL
                                      </span>
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
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

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>
          Loading...
        </div>
      }
    >
      <PlaygroundContent />
    </Suspense>
  );
}
