import React, { useEffect, useState } from 'react';
import { Title, Text, Container, SimpleGrid, Button, Group, Skeleton } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FantasyCard } from '../components/primitives/FantasyCard';
import { CreateEntityModal } from '../components/workspace/CreateEntityModal';
import { dataService as APIService } from '../data/dataService';
import type { World } from '../data/mockData';

export const WorldsPage: React.FC = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchWorlds = () => {
    APIService.getWorlds()
      .then(setWorlds)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorlds();
  }, []);

  const handleCreateWorld = async (data: Record<string, string>) => {
    setSaving(true);
    try {
      const newWorld = await APIService.createEntity('world', data);
      setModalOpened(false);
      navigate(`/view/world/${newWorld.id}`);
    } catch(e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <Container size="xl" py="xl" style={{ flex: 1 }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} ff="heading" c="gold.4">Your Worlds</Title>
          <Text c="dimmed">Select a universe to begin storytelling.</Text>
        </div>
        <Button 
          leftSection={<Plus size={18} />} 
          variant="filled" 
          color="brown" 
          radius="md"
          onClick={() => setModalOpened(true)}
        >
          New World
        </Button>
      </Group>

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          <Skeleton height={140} radius="md" />
          <Skeleton height={140} radius="md" />
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {worlds.map((world) => (
            <FantasyCard
              key={world.id}
              title={world.name}
              description={world.description}
              onClick={() => navigate(`/view/world/${world.id}`)}
            />
          ))}
        </SimpleGrid>
      )}

      <CreateEntityModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        entityType="world"
        onSubmit={handleCreateWorld}
        loading={saving}
      />
    </Container>
  );
};
