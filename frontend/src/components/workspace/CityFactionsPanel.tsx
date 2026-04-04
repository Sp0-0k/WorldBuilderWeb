import React, { useEffect, useState } from 'react';
import { Paper, Title, Group, Text, Badge, Stack, MultiSelect, Button } from '@mantine/core';
import { Shield } from 'lucide-react';
import { dataService as APIService } from '../../data/dataService';
import type { Faction } from '../../data/mockData';

interface CityFactionsPanelProps {
  entity: any;
  isEditing: boolean;
  worldId: string;
  onEntityUpdate: (updated: any) => void;
}

export const CityFactionsPanel: React.FC<CityFactionsPanelProps> = ({
  entity, isEditing, worldId, onEntityUpdate,
}) => {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [keyFactionIds, setKeyFactionIds] = useState<string[]>(entity.keyFactionIds ?? []);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    APIService.getFactions(worldId).then(setFactions);
  }, [worldId]);

  useEffect(() => {
    setKeyFactionIds(entity.keyFactionIds ?? []);
    setDirty(false);
  }, [entity.id]);

  const handleSave = async () => {
    setSaving(true);
    const updated = await APIService.updateEntity('city', entity.id, { keyFactionIds });
    onEntityUpdate(updated);
    setDirty(false);
    setSaving(false);
  };

  const keyFactions = factions.filter(f => keyFactionIds.includes(f.id));

  if (!isEditing && keyFactions.length === 0) return null;

  return (
    <Paper p="xl" radius="md" mt="md">
      <Group mb="md" gap="xs">
        <Shield size={18} color="var(--mantine-color-gold-4)" />
        <Title order={4} ff="heading" c="gold.4">Key Factions</Title>
      </Group>

      {isEditing ? (
        <Stack gap="sm">
          {factions.length === 0 ? (
            <Text size="sm" c="dimmed" fs="italic">
              No factions exist yet. Create factions in Settings first.
            </Text>
          ) : (
            <MultiSelect
              data={factions.map(f => ({ value: f.id, label: f.name }))}
              value={keyFactionIds}
              onChange={vals => { setKeyFactionIds(vals); setDirty(true); }}
              placeholder="Select key factions in this region…"
            />
          )}
          <Group justify="flex-end">
            <Button
              size="sm"
              color="forestGreen"
              loading={saving}
              disabled={!dirty}
              onClick={handleSave}
            >
              Save Key Factions
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="xs">
          {keyFactions.map(f => (
            <Group key={f.id} gap="sm">
              <Text fw={500}>{f.name}</Text>
              {f.powerLevel && (
                <Badge color="brown" variant="light" size="sm">{f.powerLevel}</Badge>
              )}
            </Group>
          ))}
        </Stack>
      )}
    </Paper>
  );
};
