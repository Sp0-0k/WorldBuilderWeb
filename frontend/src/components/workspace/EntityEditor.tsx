import React, { useState, useEffect } from 'react';
import { Paper, Title, Text, Group, Button, Stack, TextInput, Textarea } from '@mantine/core';
import { Edit2, Save, X } from 'lucide-react';
import type { AnyEntity, BaseEntityType } from '../../data/mockData';
import { SCHEMA_FIELDS } from '../../data/mockData';
import { dataService as APIService } from '../../data/dataService';
import { POIInventoryPanel } from './POIInventoryPanel';
import { CityFactionsPanel } from './CityFactionsPanel';
import { NPCFactionsPanel } from './NPCFactionsPanel';
import { NPCMemoriesPanel } from './NPCMemoriesPanel';
import { NPCChatPanel } from './NPCChatPanel';

interface EntityEditorProps {
  entity: AnyEntity;
  onSave: (entity: AnyEntity) => void;
  onEditingChange?: (isEditing: boolean) => void;
  /** Ancestor chain passed down to POIInventoryPanel for AI context. */
  parentChain?: AnyEntity[];
}

export const EntityEditor: React.FC<EntityEditorProps> = ({ entity, onSave, onEditingChange, parentChain = [] }) => {
  const [isEditing, setIsEditing] = useState(false);

  const setEditing = (val: boolean) => {
    setIsEditing(val);
    onEditingChange?.(val);
  };
  const [draft, setDraft] = useState<AnyEntity>(entity);
  const [isSaving, setIsSaving] = useState(false);
  const draftRecord = draft as Record<string, unknown>;

  useEffect(() => {
    queueMicrotask(() => {
      setDraft(entity);
      setEditing(false);
    });
  }, [entity.id]); // Reset only when navigating to a different entity, not on field updates

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only save fields that EntityEditor manages to avoid overwriting
      // relation fields (keyFactionIds, factionIds) managed by their own panels.
      const schemaKeys = SCHEMA_FIELDS[entity.type as BaseEntityType] ?? [];
      const payload: Record<string, unknown> = {
        name: draft.name,
        description: draft.description,
      };
      for (const key of schemaKeys) {
        payload[key] = draftRecord[key];
      }
      const updated = await APIService.updateEntity(entity.type as BaseEntityType, entity.id, payload);
      onSave(updated as AnyEntity);
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
                setDraft(prev => ({ ...prev, name: val }) as AnyEntity);
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
                setDraft(prev => ({ ...prev, description: val }) as AnyEntity);
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
            {SCHEMA_FIELDS[entity.type as BaseEntityType]?.filter(key => key !== 'personality').map(key => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const entityRecord = entity as Record<string, unknown>;
              const val = (draftRecord[key] as string) || '';
              const shouldRenderView = !isEditing && entityRecord[key] && String(entityRecord[key]).trim() !== '';

              if (isEditing) {
                return (
                  <TextInput
                    key={key}
                    label={label}
                    value={val}
                    onChange={e => {
                      const newVal = e.currentTarget.value;
                      setDraft(prev => ({ ...prev, [key]: newVal }) as AnyEntity);
                    }}
                  />
                );
              }

              if (shouldRenderView) {
                return (
                  <div key={key}>
                    <Text size="xs" tt="uppercase" c="dimmed" fw={600}>{label}</Text>
                    <Text>{String(entityRecord[key])}</Text>
                  </div>
                );
              }

              return null;
            })}
          </Group>

          {SCHEMA_FIELDS[entity.type as BaseEntityType]?.includes('personality') && (
            isEditing ? (
              <Textarea
                key="personality"
                label="Personality & Quirks"
                value={(draftRecord['personality'] as string) || ''}
                onChange={e => {
                  const newVal = e.currentTarget.value;
                  setDraft(prev => ({ ...prev, personality: newVal }) as AnyEntity);
                }}
                minRows={3}
                autosize
              />
            ) : ((entity as Record<string, unknown>)['personality'] && String((entity as Record<string, unknown>)['personality']).trim() !== '') ? (
              <div key="personality">
                <Text size="xs" tt="uppercase" c="dimmed" fw={600}>Personality & Quirks</Text>
                <Text>{String((entity as Record<string, unknown>)['personality'])}</Text>
              </div>
            ) : null
          )}
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

      {entity.type === 'npc' && (
        <NPCMemoriesPanel
          entity={entity}
          isEditing={isEditing}
          onMemoriesChange={onSave}
        />
      )}

      {entity.type === 'npc' && (
        <NPCChatPanel
          entity={entity}
          parentChain={parentChain}
          onMemoryAdded={onSave}
        />
      )}
    </>
  );
};
