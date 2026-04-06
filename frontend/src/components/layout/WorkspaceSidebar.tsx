import React from 'react';
import { Accordion, AppShell, Divider, Modal, NavLink, ScrollArea, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Settings, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BaseEntity } from '../../data/mockData';
import { SearchSection } from '../sidebar/SearchSection';
import { HierarchyTree } from '../sidebar/HierarchyTree';
import { PinnedSection } from '../sidebar/PinnedSection';
import { SettingsPage } from '../../pages/SettingsPage';

interface WorkspaceSidebarProps {
  worldId: string | null;
  currentEntityId: string;
  ancestorIds: string[];
  pins: BaseEntity[];
  onUnpin: (id: string) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  worldId, currentEntityId, ancestorIds, pins, onUnpin,
}) => {
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure();
  const navigate = useNavigate();

  return (
    <AppShell.Navbar
      p="xs"
      style={{
        backgroundColor: 'rgba(30, 33, 36, 0.5)', backdropFilter: 'blur(12px)',
        borderRightColor: 'var(--mantine-color-brown-9)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppShell.Section p="xs">
        <NavLink
          label="Return to Worlds"
          leftSection={<Globe size={16} />}
          onClick={() => navigate('/worlds')}
          styles={{ label: { fontSize: 13, fontWeight: 500 } }}
        />
      </AppShell.Section>

      <Divider color="brown.9" />

      {/* Search */}
      <AppShell.Section p="xs">
        {worldId ? (
          <SearchSection worldId={worldId} />
        ) : (
          <Text size="xs" c="dimmed" fs="italic">Loading...</Text>
        )}
      </AppShell.Section>

      <Divider color="brown.9" />

      {/* Hierarchy + Pinned (scrollable) */}
      <AppShell.Section grow component={ScrollArea} p="xs">
        <Accordion
          multiple
          defaultValue={['hierarchy', 'pinned']}
          chevronPosition="right"
          styles={{
            control: { padding: '6px 4px' },
            content: { padding: '0 0 8px 0' },
            chevron: { color: 'var(--mantine-color-dimmed)' },
          }}
        >
          <Accordion.Item value="hierarchy">
            <Accordion.Control>
              <Text size="xs" tt="uppercase" c="dimmed" fw={600}>World Tree</Text>
            </Accordion.Control>
            <Accordion.Panel>
              {worldId ? (
                <HierarchyTree
                  worldId={worldId}
                  currentEntityId={currentEntityId}
                  ancestorIds={ancestorIds}
                />
              ) : (
                <Text size="xs" c="dimmed" fs="italic" px="xs">No world loaded</Text>
              )}
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="pinned">
            <Accordion.Control>
              <Text size="xs" tt="uppercase" c="dimmed" fw={600}>Pinned</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <PinnedSection
                pins={pins}
                currentEntityId={currentEntityId}
                onUnpin={onUnpin}
              />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </AppShell.Section>

      <Divider color="brown.9" />

      {/* Settings footer */}
      <AppShell.Section p="xs">
        <NavLink
          label="Settings"
          leftSection={<Settings size={16} />}
          onClick={openSettings}
          styles={{ label: { fontSize: 13 } }}
        />
      </AppShell.Section>

      <Modal
        opened={settingsOpened}
        onClose={closeSettings}
        title="Settings"
        size="lg"
        styles={{
          content: { backgroundColor: 'rgba(30, 33, 36, 0.5)', backdropFilter: 'blur(12px)' },
          header: {
            backgroundColor: 'rgba(30, 33, 36, 0.5)', backdropFilter: 'blur(12px)',
            borderBottomColor: 'var(--mantine-color-brown-9)',
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
          },
          title: { fontFamily: 'var(--mantine-font-family-headings)', color: 'var(--mantine-color-gold-4)', fontSize: 18 },
        }}
      >
        <SettingsPage worldId={worldId} />
      </Modal>
    </AppShell.Navbar>
  );
};
