# DataTable Component

A powerful and flexible data table component built with TanStack Table and shadcn/ui.

## Features

- ✅ Sorting (ascending/descending)
- ✅ Filtering (by column)
- ✅ Pagination (with page size selection)
- ✅ Column visibility toggle
- ✅ Row selection (with checkboxes)
- ✅ Responsive design
- ✅ Reusable components

## Installation

The required dependencies are already included in this project:

- `@tanstack/react-table`
- All shadcn/ui components (table, button, checkbox, dropdown-menu, input, select)

## Usage

### Basic Example

```tsx
import { DataTable } from '@/components/datatable';
import { columns } from '@/components/datatable/columns';

const data = [
  {
    id: '1',
    amount: 100,
    status: 'success',
    email: 'user@example.com',
  },
  // ... more data
];

export default function Page() {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey='email'
      searchPlaceholder='Filter emails...'
    />
  );
}
```

### Custom Columns

Create your own column definitions:

```tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/datatable/data-table-column-header';

export type YourDataType = {
  id: string;
  name: string;
  // ... your fields
};

export const columns: ColumnDef<YourDataType>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
  },
  // ... more columns
];
```

## Components

### DataTable

Main table component with built-in sorting, filtering, pagination, and column visibility.

**Props:**

- `columns`: Column definitions (ColumnDef[])
- `data`: Your data array
- `searchKey?`: Column key to enable search (optional)
- `searchPlaceholder?`: Search input placeholder (optional)

### DataTableColumnHeader

Sortable column header with hide option.

### DataTablePagination

Full-featured pagination controls with page size selector.

### DataTableViewOptions

Column visibility toggle dropdown.

## Customization

All components follow shadcn/ui and TanStack Table guidelines, making them fully customizable:

1. **Styling**: Modify className props or update theme variables
2. **Behavior**: Adjust TanStack Table options in `data-table.tsx`
3. **Layout**: Components are modular - use them independently

## Example Page

See `components/datatable/example.tsx` for a complete working example.
