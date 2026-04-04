import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Group, Button, Stack, TextInput, Textarea } from '@mantine/core';
import { Edit2, Save, X } from 'lucide-react';
import type { BaseEntityType } from '../../data/mockData';
import { SCHEMA_FIELDS } from '../../data/mockData';
import { APIService } from '../../data/MockDataService';
import { POIInventoryPanel } from './POIInventoryPanel';
import { CityFactionsPanel } from './CityFactionsPanel';
import { NPCFactionsPanel } from './NPCFactionsPanel';

interface EntityEditorProps {
  entity: any;
  onSave: (entity: any) => void;
  onEditingChange?: (isEditing: boolean) => void;
  /** Ancestor chain passed down to POIInventoryPanel for AI context. */
  parentChain?: any[];
}

export const EntityEditor: React.FC<EntityEditorProps> = ({ entity, onSave, onEditingChange, parentChain = [] }) => {
  const [isEditing, setIsEditing] = useState(false);

  const setEditing = (val: boolean) => {
    setIsEditing(val);
    onEditingChange?.(val);
  };
  const [draft, setDraft] = useState(entity);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(entity);
    setEditing(false);
  }, [entity.id]); // Reset only when navigating to a different entity, not on field updates

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only save fields that EntityEditor manages to avoid overwriting
      // relation fields (keyFactionIds, factionIds) managed by their own panels.
      const schemaKeys = SCHEMA_FIELDS[entity.type as BaseEntityType] ?? [];
      const payload: Record<string, any> = {
        name: draft.name,
        description: draft.description,
      };
      for (const key of schemaKeys) {
        payload[key] = draft[key];
      }
      const updated = await APIService.updateEntity(entity.type as BaseEntityType, entity.id, payload);
      onSave(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setDraft(entity);
    setEditing(false);
  };

  return (
    <>
      <Paper p="xl" radius="md">
        <Group justify="space-between" mb="lg">
          {isEditing ? (
            <TextInput
              value={draft.name}
              onChange={(e) => {
                const val = e.currentTarget.value;
                setDraft((prev: any) => ({ ...prev, name: val }));
              }}
              size="lg"
              styles={{ input: { fontFamily: 'var(--mantine-font-family-headings)', fontWeight: 700, fontSize: 24 } }}
            />
          ) : (
            <Title order={2} ff="heading" c="gold.4">{entity.name}</Title>
          )}

          {isEditing ? (
            <Group>
              <Button variant="subtle" color="gray" onClick={handleCancel} disabled={isSaving} leftSection={<X size={16} />}>Cancel</Button>
              <Button color="forestGreen" onClick={handleSave} loading={isSaving} leftSection={<Save size={16} />}>Save</Button>
            </Group>
          ) : (
            <Button variant="outline" color="brown" onClick={() => setEditing(true)} leftSection={<Edit2 size={16} />}>
              Edit
            </Button>
          )}
        </Group>

        <Stack gap="md">
          {isEditing ? (
            <Textarea
              label="Description"
              value={draft.description}
              onChange={(e) => {
                const val = e.currentTarget.value;
                setDraft((prev: any) => ({ ...prev, description: val }));
              }}
              minRows={4}
              autosize
            />
          ) : (
            <div>
              <Text c="dimmed" size="sm" tt="uppercase" fw={600} mb={4}>Description</Text>
              <Text>{entity.description}</Text>
            </div>
          )}

          <Group grow align="flex-start">
            {SCHEMA_FIELDS[entity.type as BaseEntityType]?.map(key => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const val = draft[key] || '';
              const shouldRenderView = !isEditing && entity[key] && entity[key].toString().trim() !== '';

              if (isEditing) {
                return (
                  <TextInput
                    key={key}
                    label={label}
                    value={val}
                    onChange={e => {
                      const newVal = e.currentTarget.value;
                      setDraft((prev: any) => ({ ...prev, [key]: newVal }));
                    }}
                  />
                );
              }

              if (shouldRenderView) {
                return (
                  <div key={key}>
                    <Text size="xs" tt="uppercase" c="dimmed" fw={600}>{label}</Text>
                    <Text>{entity[key]}</Text>
                  </div>
                );
              }

              return null;
            })}
          </Group>
        </Stack>
      </Paper>

      {entity.type === 'poi' && (entity.inventoryEnabled || isEditing) && (
        <POIInventoryPanel
          entity={entity}
          isEditing={isEditing}
          parentChain={parentChain}
          onEntityUpdate={onSave}
        />
      )}

      {entity.type === 'city' && parentChain[0]?.id && (
        <CityFactionsPanel
          entity={entity}
          isEditing={isEditing}
          worldId={parentChain[0].id}
          onEntityUpdate={onSave}
        />
      )}

      {entity.type === 'npc' && parentChain[0]?.id && (
        <NPCFactionsPanel
          entity={entity}
          isEditing={isEditing}
          worldId={parentChain[0].id}
          onEntityUpdate={onSave}
        />
      )}
    </>
  );
};
