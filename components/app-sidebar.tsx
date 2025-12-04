'use client';

import * as React from 'react';
import { Code2, Database as DatabaseIcon, LayoutDashboard } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ConnectionSwitcher } from '@/components/connection-switcher';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';

interface DatabaseInfo {
  name: string;
  size: string;
  tables?: string[];
}

interface ConnectionInfo {
  hostname: string;
  username: string;
  networkType: string;
}

export function AppSidebar({
  databases,
  connectionInfo,
  selectedDatabase,
  onSelectDatabase,
  onDisconnect,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  databases: DatabaseInfo[];
  connectionInfo: ConnectionInfo;
  selectedDatabase: string | null;
  onSelectDatabase: (database: string) => void;
  onDisconnect: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Playground',
      href: '/playground',
      icon: Code2,
    },
  ];

  return (
    <Sidebar
      className='top-(--header-height) h-[calc(100svh-var(--header-height))]!'
      {...props}
    >
      <SidebarHeader>
        <ConnectionSwitcher connectionInfo={connectionInfo} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <a href={`${item.href}${search}`}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <NavMain
          databases={databases}
          selectedDatabase={selectedDatabase}
          onSelectDatabase={onSelectDatabase}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser connectionInfo={connectionInfo} onDisconnect={onDisconnect} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
