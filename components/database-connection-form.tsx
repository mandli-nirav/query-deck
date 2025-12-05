'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const formSchema = z.object({
  networkType: z.enum(['mysql', 'postgresql'], {
    message: 'Please select a database type',
  }),
  hostname: z.string().min(1, 'Hostname/IP is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(),
  port: z.string().regex(/^\d+$/, 'Port must be a number'),
});

type FormValues = z.infer<typeof formSchema>;

interface DatabaseInfo {
  name: string;
  size: string;
}

export function DatabaseConnectionForm() {
  const router = useRouter();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPrivateIPWarning, setShowPrivateIPWarning] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      networkType: 'mysql',
      hostname: '',
      username: '',
      password: '',
      port: '3306',
    },
  });

  // Check if hostname is localhost or private IP
  const checkHostname = (hostname: string) => {
    const isLocalhost = /^(localhost|127\.0\.0\.1|::1)$/i.test(hostname);
    const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname);
    setShowPrivateIPWarning(isLocalhost || isPrivateIP);
  };

  const onSubmit = async (data: FormValues) => {
    console.log('Form submitted:', data);
    // Handle form submission for connecting to database
  };

  const testConnection = async () => {
    const values = form.getValues();
    const validation = formSchema.safeParse(values);

    if (!validation.success) {
      // Trigger validation errors
      Object.keys(validation.error.flatten().fieldErrors).forEach((field) => {
        form.setError(field as keyof FormValues, {
          message:
            validation.error.flatten().fieldErrors[
              field as keyof FormValues
            ]?.[0],
        });
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setDatabases([]);
    setErrorMessage('');

    try {
      // Call the API to test connection
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus('success');
        setDatabases(data.databases || []);

        // Navigate to dashboard with connection data
        const params = new URLSearchParams({
          databases: encodeURIComponent(JSON.stringify(data.databases || [])),
          hostname: values.hostname,
          username: values.username,
          networkType: values.networkType,
          password: values.password || '',
          port: values.port,
        });

        router.push(`/dashboard?${params.toString()}`);
      } else {
        setConnectionStatus('error');
        setErrorMessage(data.error || 'Connection failed. Please try again.');
        console.error('Connection error:', data.error || data.details);
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage('Network error. Please check your connection.');
      console.error('Connection failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Update port when network type changes
  const handleNetworkTypeChange = (value: 'mysql' | 'postgresql') => {
    form.setValue('networkType', value);
    // Set default ports
    if (value === 'mysql') {
      form.setValue('port', '3306');
    } else if (value === 'postgresql') {
      form.setValue('port', '5432');
    }
  };

  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Database className='h-6 w-6' />
          Database Connection
        </CardTitle>
        <CardDescription>
          Connect to your MySQL or PostgreSQL database server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6'
            autoComplete='off'
          >
            <FormField
              control={form.control}
              name='networkType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Network Type</FormLabel>
                  <Select
                    onValueChange={handleNetworkTypeChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select database type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='mysql'>MySQL</SelectItem>
                      <SelectItem value='postgresql'>PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='hostname'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hostname/IP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='localhost or 192.168.1.1'
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          checkHostname(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='port'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='3306'
                        min='1'
                        max='65535'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder='postgres' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='••••••••'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showPrivateIPWarning && (
              <Alert className='border-amber-500/50 bg-amber-500/10'>
                <AlertCircle className='h-4 w-4 text-amber-500' />
                <AlertDescription className='text-amber-600 dark:text-amber-400'>
                  <strong>Warning:</strong> You're using a localhost or private IP address. 
                  This will only work when running locally. For deployed applications, use a 
                  publicly accessible database from services like{' '}
                  <a href='https://railway.app' target='_blank' rel='noopener noreferrer' className='underline'>Railway</a>,{' '}
                  <a href='https://supabase.com' target='_blank' rel='noopener noreferrer' className='underline'>Supabase</a>, or{' '}
                  <a href='https://planetscale.com' target='_blank' rel='noopener noreferrer' className='underline'>PlanetScale</a>.
                </AlertDescription>
              </Alert>
            )}

            <div className='flex gap-3'>
              <Button
                type='button'
                onClick={testConnection}
                disabled={isTestingConnection}
                className='flex-1'
              >
                {isTestingConnection ? (
                  <>
                    <Spinner />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>

            {connectionStatus === 'success' && databases.length > 0 && (
              <div className='rounded-lg border bg-muted/50 p-4'>
                <h3 className='mb-3 text-sm font-medium'>
                  Available Databases ({databases.length})
                </h3>
                <div className='space-y-2'>
                  {databases.map((db) => (
                    <div
                      key={db.name}
                      className='flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <Database className='h-4 w-4 text-muted-foreground' />
                        <span>{db.name}</span>
                      </div>
                      <span className='text-muted-foreground text-xs'>
                        {db.size}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {connectionStatus === 'error' && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  {errorMessage ||
                    'Connection failed. Please check your credentials and try again.'}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
