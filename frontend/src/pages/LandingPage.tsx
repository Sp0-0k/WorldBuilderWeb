import React, { useState } from 'react';
import { Title, Text, Container, Paper, TextInput, PasswordInput, Button, Group, Stack, SimpleGrid } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email);
      navigate('/worlds');
    }
  };

  return (
    <Container size="lg" py="xl" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" w="100%">
        {/* About Section */}
        <Stack justify="center" p="md">
          <Title order={1} ff="heading" c="gold.4" size="3.5rem">WorldBuilder</Title>
          <Text size="lg" c="dimmed">
            Your ultimate tool for crafting intricate universes, managing sprawling lore, 
            and keeping track of every detail across your worlds.
          </Text>
          <Text size="md" mt="md" c="dimmed">
            Whether you're an author, a dungeon master, or a narrative designer, WorldBuilder helps 
            you connect characters, locations, and history seamlessly.
          </Text>
        </Stack>

        {/* Login Section */}
        <Paper p="xl" radius="md" style={{ backgroundColor: 'var(--mantine-color-darkGray-9)', border: '1px solid var(--mantine-color-brown-9)' }}>
          <Title order={2} ff="heading" c="gold.4" mb="lg">Welcome Back</Title>
          
          <form onSubmit={handleLogin}>
            <Stack>
              <TextInput
                required
                label="Email"
                placeholder="hello@example.com"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                radius="md"
              />

              <PasswordInput
                required
                label="Password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                radius="md"
              />

              <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed">
                   No account? <i>Registration coming soon.</i>
                </Text>
              </Group>

              <Button type="submit" fullWidth variant="filled" color="brown" radius="md">
                Log In
              </Button>
            </Stack>
          </form>
        </Paper>
      </SimpleGrid>
    </Container>
  );
};
