import { ModeToggle } from '@/components/mode-toggle';
import { DatabaseConnectionForm } from '@/components/database-connection-form';

export default function Home() {
  return (
    <div className='min-h-screen bg-background font-sans'>
      <div className='fixed top-4 right-4 z-50'>
        <ModeToggle />
      </div>

      <div className='container mx-auto px-4 py-16'>
        {/* Header Section */}
        <div className='mb-12 text-center'>
          <h1 className='mb-4 text-4xl font-bold tracking-tight text-foreground'>
            Database Connection Manager
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
            Connect to your MySQL or PostgreSQL databases securely and manage
            your database connections in one place.
          </p>
        </div>

        {/* Form Section */}
        <div className='flex justify-center'>
          <DatabaseConnectionForm />
        </div>
      </div>
    </div>
  );
}
