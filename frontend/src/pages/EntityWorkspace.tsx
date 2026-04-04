import React, { useEffect, useState } from 'react';
import { Title, Container, SimpleGrid, Paper, Skeleton, Group, Button, Text, Modal } from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APIService } from '../data/MockDataService';
import type { BaseEntity, BaseEntityType } from '../data/mockData';
import { getChildType, getParentType } from '../data/mockData';
import { BreadcrumbHeader } from '../components/workspace/BreadcrumbHeader';
import { FantasyCard } from '../components/primitives/FantasyCard';
import { EntityEditor } from '../components/workspace/EntityEditor';
import { WorkspaceSidebar } from '../components/layout/WorkspaceSidebar';
import { CreateEntityModal } from '../components/workspace/CreateEntityModal';

export const EntityWorkspace: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const [entity, setEntity] = useState<any | null>(null);
  const [children, setChildren] = useState<any[]>([]);

  const [parentChain, setParentChain] = useState<BaseEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<BaseEntity[]>([]);
  
  const [modalOpened, setModalOpened] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingChild, setDeletingChild] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkspace = async () => {
    if (!type || !id) return;
    setLoading(true);
    const data = await APIService.getEntityByRoute(type as BaseEntityType, id);
    setEntity(data);

    if (data) {
      // Build Parent Chain
      let chain: any[] = [];
      let curr = data;
      let cType = type;
      
      while (curr && curr.parentId) {
        const pType: any = getParentType(cType);
        if(!pType) break;
        const parentData = await APIService.getEntityByRoute(pType as BaseEntityType, curr.parentId);
        if (parentData) {
            chain.unshift(parentData);
            curr = parentData;
            cType = pType;
        } else {
            break;
        }
      }
      setParentChain(chain);

      // Fetch Children
      const childType = getChildType(type);
      if (childType) {
        const kids = await APIService.getChildren(type as BaseEntityType, data.id, childType);
        setChildren(kids);
      } else {
        setChildren([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspace();
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id]);

  useEffect(() => {
    APIService.getPins().then(setPins);
  }, []);

  const handleTogglePin = async (ent: BaseEntity) => {
    const alreadyPinned = pins.some(p => p.id === ent.id);
    if (alreadyPinned) {
      await APIService.removePin(ent.id);
      setPins(prev => prev.filter(p => p.id !== ent.id));
    } else {
      await APIService.addPin(ent.id);
      setPins(prev => [...prev, ent]);
    }
  };

  const handleUnpin = async (pinId: string) => {
    await APIService.removePin(pinId);
    setPins(prev => prev.filter(p => p.id !== pinId));
  };

  const childType = getChildType(type || '');

  const handleConfirmDeleteChild = async () => {
    if (!deletingChild || !childType) return;
    setIsDeleting(true);
    try {
      await APIService.deleteEntity(childType, deletingChild.id);
      setChildren(prev => prev.filter(c => c.id !== deletingChild.id));
      setDeletingChild(null);
    } catch (e) {
      console.error(e);
    }
    setIsDeleting(false);
  };

  const handleCreateChild = async (data: any) => {
    if (!childType || !entity) return;
    setSaving(true);
    try {
      const newChild = await APIService.createEntity(childType, { ...data, parentId: entity.id });
      setModalOpened(false);
      setChildren(prev => [...prev, newChild]);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const worldId = entity?.type === 'world' ? entity.id : (parentChain[0]?.id ?? null);
  const isPinned = entity ? pins.some(p => p.id === entity.id) : false;

  return (
    <>
      <WorkspaceSidebar
        worldId={worldId}
        currentEntityId={entity?.id ?? ''}
        ancestorIds={parentChain.map(e => e.id)}
        pins={pins}
        onUnpin={handleUnpin}
      />

      <Container size="xl" py="xl" style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {!entity && loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Skeleton height={400} radius="md" />
            </motion.div>
          ) : !entity ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Title order={2} c="deepRed.4">Entity Not Found</Title>
            </motion.div>
          ) : (
            <motion.div
              key="workspace-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 0.4 : 1, y: loading ? 5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <BreadcrumbHeader
                entity={entity}
                parentChain={parentChain}
                isPinned={isPinned}
                onTogglePin={() => handleTogglePin(entity)}
              />
              
              <EntityEditor entity={entity} parentChain={parentChain} onEditingChange={setIsEditing} onSave={(updated: any) => {
                setEntity(updated);
              }} />

              {childType && (
                <Paper mt="xl" p="md" bg="transparent">
                  <Group justify="space-between" mb="md">
                    <Title order={3} ff="heading" c="gold.4">
                      {({ country: 'Countries', city: 'Cities', poi: 'Points of Interest', npc: 'NPCs' } as Record<string, string>)[childType] || 'Contents'}
                    </Title>
                    <Button 
                      variant="light" 
                      color="brown" 
                      size="sm" 
                      leftSection={<Plus size={16} />}
                      onClick={() => setModalOpened(true)}
                    >
                      New {childType.charAt(0).toUpperCase() + childType.slice(1)}
                    </Button>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                    {children.map(child => (
                      <FantasyCard
                        key={child.id}
                        title={child.name}
                        description={child.description}
                        onClick={() => navigate(`/view/${childType}/${child.id}`)}
                        onDelete={isEditing ? () => setDeletingChild(child) : undefined}
                      />
                    ))}
                  </SimpleGrid>
                  {children.length === 0 && (
                    <Text c="dimmed" fs="italic">No detailed contents created yet.</Text>
                  )}
                </Paper>
              )}

              {childType && deletingChild && (
                <Modal
                  opened={!!deletingChild}
                  onClose={() => setDeletingChild(null)}
                  title={`Delete "${deletingChild.name}"?`}
                  centered
                  size="sm"
                  styles={{ title: { fontFamily: 'var(--mantine-font-family-headings)', color: 'var(--mantine-color-deepRed-4)', fontSize: 18 } }}
                >
                  <Text size="sm" mb="lg">
                    {
                      ({
                        country: 'This will permanently delete this country and ALL of its cities, points of interest, NPCs, and inventory items.',
                        city:    'This will permanently delete this city and ALL of its points of interest, NPCs, and inventory items.',
                        poi:     'This will permanently delete this location and ALL of its NPCs and inventory items.',
                        npc:     'This will permanently delete this NPC.',
                      } as Record<string, string>)[deletingChild.type] ?? 'This will permanently delete this entity.'
                    }{' '}
                    <Text span fw={700}>This cannot be undone.</Text>
                  </Text>
                  <Group justify="flex-end">
                    <Button variant="subtle" color="gray" onClick={() => setDeletingChild(null)}>Cancel</Button>
                    <Button color="deepRed" loading={isDeleting} leftSection={<Trash2 size={16} />} onClick={handleConfirmDeleteChild}>
                      Delete
                    </Button>
                  </Group>
                </Modal>
              )}

              {childType && (
                <CreateEntityModal
                  opened={modalOpened}
                  onClose={() => setModalOpened(false)}
                  entityType={childType}
                  onSubmit={handleCreateChild}
                  loading={saving}
                  context={{ entity, parentChain }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </>
  );
};
