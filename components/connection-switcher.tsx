'use client';

import * as React from 'react';
import { Database } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface ConnectionInfo {
  hostname: string;
  username: string;
  networkType: string;
}

export function ConnectionSwitcher({
  connectionInfo,
}: {
  connectionInfo: ConnectionInfo;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg' asChild>
          <a href='#'>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Database className='size-4' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>
                {connectionInfo.hostname}
              </span>
              <span className='truncate text-xs capitalize'>
                {connectionInfo.networkType}
              </span>
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
