import React, { useEffect, useState } from 'react';
import { Paper, Title, Group, Text, Badge, Stack, Button, Select, TextInput, ActionIcon } from '@mantine/core';
import { Plus, X, Shield } from 'lucide-react';
import { dataService as APIService } from '../../data/dataService';
import type { Faction } from '../../data/mockData';

interface NPCFactionsPanelProps {
  entity: any;
  isEditing: boolean;
  worldId: string;
  onEntityUpdate: (updated: any) => void;
}

export const NPCFactionsPanel: React.FC<NPCFactionsPanelProps> = ({
  entity, isEditing, worldId, onEntityUpdate,
}) => {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addFactionId, setAddFactionId] = useState<string>('');
  const [addRole, setAddRole] = useState('');
  const [saving, setSaving] = useState(false);

  const loadFactions = () => APIService.getFactions(worldId).then(setFactions);

  useEffect(() => {
    loadFactions();
  }, [worldId]);

  useEffect(() => {
    setShowAdd(false);
    setAddFactionId('');
    setAddRole('');
  }, [entity.id]);

  // Derive memberships from faction.members (authoritative source for roles)
  const memberFactions = factions.filter(f => f.members.some(m => m.npcId === entity.id));
  const getRole = (factionId: string) =>
    factions.find(f => f.id === factionId)?.members.find(m => m.npcId === entity.id)?.role ?? '';

  const handleAdd = async () => {
    if (!addFactionId) return;
    setSaving(true);
    await APIService.addNPCToFaction(addFactionId, entity.id, addRole);
    await loadFactions();
    const updatedNpc = await APIService.getEntityByRoute('npc', entity.id);
    if (updatedNpc) onEntityUpdate(updatedNpc);
    setAddFactionId('');
    setAddRole('');
    setShowAdd(false);
    setSaving(false);
  };

  const handleRemove = async (factionId: string) => {
    await APIService.removeNPCFromFaction(factionId, entity.id);
    await loadFactions();
    const updatedNpc = await APIService.getEntityByRoute('npc', entity.id);
    if (updatedNpc) onEntityUpdate(updatedNpc);
  };

  const availableFactions = factions.filter(f => !f.members.some(m => m.npcId === entity.id));

  if (!isEditing && memberFactions.length === 0) return null;

  return (
    <Paper p="xl" radius="md" mt="md">
      <Group mb="md" gap="xs">
        <Shield size={18} color="var(--mantine-color-gold-4)" />
        <Title order={4} ff="heading" c="gold.4">Faction Memberships</Title>
      </Group>

      <Stack gap="sm">
        {memberFactions.length === 0 && !showAdd && (
          <Text c="dimmed" fs="italic" size="sm">Not a member of any factions.</Text>
        )}

        {memberFactions.map(f => (
          <Group key={f.id} justify="space-between" wrap="nowrap">
            <Group gap="sm">
              <Text fw={500}>{f.name}</Text>
              {f.powerLevel && (
                <Badge color="brown" variant="light" size="sm">{f.powerLevel}</Badge>
              )}
              {getRole(f.id) && (
                <Text size="sm" c="dimmed">— {getRole(f.id)}</Text>
              )}
            </Group>
            {isEditing && (
              <ActionIcon variant="subtle" color="deepRed" size="sm" onClick={() => handleRemove(f.id)}>
                <X size={14} />
              </ActionIcon>
            )}
          </Group>
        ))}

        {isEditing && showAdd && (
          <Stack gap="xs">
            <Group grow align="flex-end">
              <Select
                label="Faction"
                placeholder="Select faction…"
                data={availableFactions.map(f => ({ value: f.id, label: f.name }))}
                value={addFactionId}
                onChange={v => setAddFactionId(v ?? '')}
                size="sm"
              />
              <TextInput
                label="Role in Faction"
                placeholder="e.g., Spy, Leader…"
                value={addRole}
                onChange={e => setAddRole(e.currentTarget.value)}
                size="sm"
              />
            </Group>
            {availableFactions.length === 0 && (
              <Text size="sm" c="dimmed" fs="italic">This NPC is already a member of all existing factions.</Text>
            )}
            <Group gap="xs" justify="flex-end">
              <Button size="sm" variant="subtle" color="gray" onClick={() => { setShowAdd(false); setAddFactionId(''); setAddRole(''); }}>
                Cancel
              </Button>
              <Button size="sm" color="forestGreen" loading={saving} disabled={!addFactionId} onClick={handleAdd}>
                Add
              </Button>
            </Group>
          </Stack>
        )}

        {isEditing && !showAdd && (
          <Button
            variant="subtle"
            color="brown"
            size="sm"
            leftSection={<Plus size={14} />}
            onClick={() => setShowAdd(true)}
          >
            Add to Faction
          </Button>
        )}
      </Stack>
    </Paper>
  );
};
