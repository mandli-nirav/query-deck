'use client';

import { columns, Payment } from './columns';
import { DataTable } from './data-table';

// Sample data - replace with your own data fetching logic
const data: Payment[] = [
  {
    id: 'm5gr84i9',
    amount: 316,
    status: 'success',
    email: 'ken99@example.com',
  },
  {
    id: '3u1reuv4',
    amount: 242,
    status: 'success',
    email: 'abe45@example.com',
  },
  {
    id: 'derv1ws0',
    amount: 837,
    status: 'processing',
    email: 'monserrat44@example.com',
  },
  {
    id: '5kma53ae',
    amount: 874,
    status: 'success',
    email: 'silas22@example.com',
  },
  {
    id: 'bhqecj4p',
    amount: 721,
    status: 'failed',
    email: 'carmella@example.com',
  },
];

export default function DataTableExample() {
  return (
    <div className='container mx-auto py-10'>
      <DataTable
        columns={columns}
        data={data}
        searchKey='email'
        searchPlaceholder='Filter emails...'
      />
    </div>
  );
}
