import React, { useEffect, useState } from "react";
import {
  Title,
  Text,
  Container,
  SimpleGrid,
  Button,
  Group,
  Skeleton,
  Modal,
} from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FantasyCard } from "../components/primitives/FantasyCard";
import { CreateEntityModal } from "../components/workspace/CreateEntityModal";
import { dataService as APIService } from "../data/dataService";
import type { World } from "../data/mockData";

export const WorldsPage: React.FC = () => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingWorld, setDeletingWorld] = useState<World | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      const newWorld = await APIService.createEntity("world", data);
      setModalOpened(false);
      navigate(`/view/world/${newWorld.id}`);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleConfirmDeleteWorld = async () => {
    if (!deletingWorld) return;
    setDeleting(true);
    try {
      await APIService.deleteEntity("world", deletingWorld.id);
      setWorlds((prev) =>
        prev.filter((world) => world.id !== deletingWorld.id),
      );
      setDeletingWorld(null);
    } catch (e) {
      console.error(e);
    }
    setDeleting(false);
  };

  return (
    <Container size="xl" py="xl" style={{ flex: 1 }}>
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} ff="heading" c="gold.4">
            Your Worlds
          </Title>
          <Text c="dimmed">Select a universe to begin storytelling.</Text>
        </div>
        <Button
          leftSection={<Plus size={18} />}
          variant="filled"
          color="brown"
          radius="md"
          onClick={() => setModalOpened(true)}>
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
              onDelete={() => setDeletingWorld(world)}
            />
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={!!deletingWorld}
        onClose={() => setDeletingWorld(null)}
        title={
          deletingWorld ? `Delete "${deletingWorld.name}"?` : "Delete world?"
        }
        centered
        size="sm"
        styles={{
          title: {
            fontFamily: "var(--mantine-font-family-headings)",
            color: "var(--mantine-color-deepRed-4)",
            fontSize: 18,
          },
        }}>
        <Text size="sm" mb="lg">
          This will permanently delete this world and ALL of its countries,
          cities, points of interest, NPCs, and inventory items.{" "}
          <Text span fw={700}>
            This cannot be undone.
          </Text>
        </Text>
        <Group justify="flex-end">
          <Button
            variant="subtle"
            color="gray"
            onClick={() => setDeletingWorld(null)}>
            Cancel
          </Button>
          <Button
            color="deepRed"
            loading={deleting}
            leftSection={<Trash2 size={16} />}
            onClick={handleConfirmDeleteWorld}>
            Delete
          </Button>
        </Group>
      </Modal>

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
