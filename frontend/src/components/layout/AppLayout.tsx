import React from 'react';
import { AppShell, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface AppLayoutProps {
  children: React.ReactNode;
  hasNavbar?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, hasNavbar = false }) => {
  const [navOpened, { toggle: toggleNav }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !navOpened, desktop: !hasNavbar },
      }}
      transitionDuration={300}
      transitionTimingFunction="ease"
      padding="md"
    >
      <AppShell.Header style={{ backgroundColor: 'var(--mantine-color-darkGray-9)', borderBottomColor: 'var(--mantine-color-brown-9)' }}>
        <Group h="100%" px="md">
          {hasNavbar && <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" color="gold" />}
          <Title order={3} ff="heading" c="gold.4">WorldBuilder</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main style={{ backgroundColor: 'var(--parchment-bg)', display: 'flex', flexDirection: 'column' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
};
