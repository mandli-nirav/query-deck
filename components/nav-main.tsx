'use client';

import { ChevronRight, Database, Table } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DatabaseInfo {
  name: string;
  size: string;
  tables?: string[];
}

interface NavMainProps {
  databases: DatabaseInfo[];
  selectedDatabase: string | null;
  onSelectDatabase: (dbName: string) => void;
}

export function NavMain({
  databases,
  selectedDatabase,
  onSelectDatabase,
}: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Databases</SidebarGroupLabel>
      <ScrollArea className='h-[calc(100vh-20rem)]'>
        <SidebarMenu>
          {databases.map((db) => (
            <Collapsible
              key={db.name}
              asChild
              defaultOpen={selectedDatabase === db.name}
              className='group/collapsible'
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={db.name}
                    onClick={() => onSelectDatabase(db.name)}
                    isActive={selectedDatabase === db.name}
                  >
                    <Database />
                    <span>{db.name}</span>
                    <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {db.tables && db.tables.length > 0 ? (
                      db.tables.map((table) => (
                        <SidebarMenuSubItem key={table}>
                          <SidebarMenuSubButton asChild>
                            <a href='#'>
                              <Table />
                              <span>{table}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))
                    ) : (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>No tables</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </ScrollArea>
    </SidebarGroup>
  );
}
