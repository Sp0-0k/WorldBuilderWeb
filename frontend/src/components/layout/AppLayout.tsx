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
      header={{ height: 64 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !navOpened, desktop: !hasNavbar },
      }}
      transitionDuration={300}
      transitionTimingFunction="ease"
      padding="xl"
    >
      <AppShell.Header style={{ 
        backgroundColor: 'rgba(24, 26, 27, 0.7)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <Group h="100%" px="xl">
          {hasNavbar && <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" color="gold" />}
          <Title 
            order={3} 
            ff="heading" 
            style={{
              background: 'linear-gradient(45deg, #fce89e, #c29707)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(255,215,0,0.2)'
            }}
          >
            WorldBuilder
          </Title>
        </Group>
      </AppShell.Header>


      <AppShell.Main style={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
};
