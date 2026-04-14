import React, { useState } from 'react';
import { Paper, Title, Text, Group, Stack, ActionIcon, Textarea, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ScrollText, Check, Trash2, Plus, Pencil, X } from 'lucide-react';
import { dataService as APIService } from '../../data/dataService';
import type { NPC, NPCMemory } from '../../data/mockData';

interface NPCMemoriesPanelProps {
  entity: NPC;
  isEditing: boolean;
  onMemoriesChange: (updated: NPC) => void;
}

export const NPCMemoriesPanel: React.FC<NPCMemoriesPanelProps> = ({
  entity, isEditing, onMemoriesChange,
}) => {
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editDates, setEditDates] = useState<Record<string, string>>({});
  const [activeEdits, setActiveEdits] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const memories: NPCMemory[] = [...(entity.memories ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const openEdit = (memId: string) =>
    setActiveEdits(prev => new Set(prev).add(memId));

  const closeEdit = (memId: string) => {
    setActiveEdits(prev => { const next = new Set(prev); next.delete(memId); return next; });
    setEditValues(prev => { const next = { ...prev }; delete next[memId]; return next; });
    setEditDates(prev => { const next = { ...prev }; delete next[memId]; return next; });
  };

  const refresh = async () => {
    const updated = await APIService.getEntityByRoute('npc', entity.id);
    if (updated) onMemoriesChange(updated as NPC);
  };

  const handleSaveEdit = async (memId: string, originalCreatedAt: string, originalContent: string) => {
    const content = editValues[memId] ?? originalContent;
    if (!content?.trim()) return;
    const dateVal = editDates[memId];
    const createdAt = dateVal
      ? new Date(dateVal + 'T' + new Date(originalCreatedAt).toISOString().slice(11)).toISOString()
      : undefined;
    setSaving(memId);
    try {
      await APIService.updateNPCMemory(entity.id, memId, content.trim(), createdAt);
      await refresh();
      closeEdit(memId);
    } catch (e: unknown) {
      notifications.show({ title: 'Save failed', message: e instanceof Error ? e.message : String(e), color: 'deepRed' });
    }
    setSaving(null);
  };

  const handleDelete = async (memId: string) => {
    setSaving(memId + '-del');
    try {
      await APIService.deleteNPCMemory(entity.id, memId);
      await refresh();
    } catch (e: unknown) {
      notifications.show({ title: 'Delete failed', message: e instanceof Error ? e.message : String(e), color: 'deepRed' });
    }
    setSaving(null);
  };

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving('new');
    try {
      await APIService.addNPCMemory(entity.id, newContent.trim());
      await refresh();
      setNewContent('');
      setShowAdd(false);
    } catch (e: unknown) {
      notifications.show({ title: 'Add failed', message: e instanceof Error ? e.message : String(e), color: 'deepRed' });
    }
    setSaving(null);
  };

  return (
    <Paper mt="md" p="xl" radius="md">
      <Group mb="md">
        <ScrollText size={20} color="var(--mantine-color-gold-4)" />
        <Title order={4} c="gold.4">Memories</Title>
      </Group>

      <Stack gap="sm">
        {memories.length === 0 && !isEditing && (
          <Text c="dimmed" size="sm">No memories yet.</Text>
        )}

        {memories.map(mem => {
          const dateStr = new Date(mem.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          });
          const editVal = editValues[mem.id] ?? mem.content;
          const editDate = editDates[mem.id] ?? new Date(mem.createdAt).toISOString().slice(0, 10);

          if (isEditing && activeEdits.has(mem.id)) {
            return (
              <Stack key={mem.id} gap="xs">
                <Group gap="xs" align="center">
                  <Text size="xs" c="dimmed">Date:</Text>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => {
                      const val = e.currentTarget.value;
                      setEditDates(prev => ({ ...prev, [mem.id]: val }));
                    }}
                    style={{ fontSize: 12, background: 'transparent', border: '1px solid var(--mantine-color-dimmed)', borderRadius: 4, padding: '2px 6px', color: 'inherit' }}
                  />
                </Group>
                <Group align="flex-start" gap="xs">
                  <Textarea
                    value={editVal}
                    onChange={e => {
                      const val = e.currentTarget.value;
                      setEditValues(prev => ({ ...prev, [mem.id]: val }));
                    }}
                    autosize
                    minRows={2}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    color="forestGreen"
                    variant="filled"
                    onClick={() => handleSaveEdit(mem.id, mem.createdAt, mem.content)}
                    loading={saving === mem.id}
                    disabled={saving !== null}
                  >
                    <Check size={14} />
                  </ActionIcon>
                  <ActionIcon
                    color="deepRed"
                    variant="subtle"
                    onClick={() => closeEdit(mem.id)}
                    disabled={saving !== null}
                  >
                    <X size={14} />
                  </ActionIcon>
                </Group>
              </Stack>
            );
          }

          return (
            <div key={mem.id}>
              <Text size="xs" c="dimmed" mb={2}>{dateStr}</Text>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Text size="sm" style={{ flex: 1 }}>{mem.content}</Text>
                {isEditing && (
                  <Group gap={4} wrap="nowrap">
                    <ActionIcon variant="subtle" color="brown" size="sm" onClick={() => openEdit(mem.id)} disabled={saving !== null}>
                      <Pencil size={13} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="deepRed" size="sm" onClick={() => handleDelete(mem.id)} loading={saving === mem.id + '-del'} disabled={saving !== null}>
                      <Trash2 size={13} />
                    </ActionIcon>
                  </Group>
                )}
              </Group>
            </div>
          );
        })}

        {isEditing && (
          showAdd ? (
            <Stack gap="xs">
              <Textarea
                placeholder="Write a new memory..."
                value={newContent}
                onChange={e => setNewContent(e.currentTarget.value)}
                autosize
                minRows={2}
              />
              <Group>
                <Button
                  size="xs"
                  color="forestGreen"
                  onClick={handleAdd}
                  loading={saving === 'new'}
                  disabled={saving !== null}
                >
                  Save
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => { setShowAdd(false); setNewContent(''); }}
                  disabled={saving !== null}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          ) : (
            <Button
              variant="outline"
              color="brown"
              size="xs"
              leftSection={<Plus size={14} />}
              onClick={() => setShowAdd(true)}
            >
              Add Memory
            </Button>
          )
        )}
      </Stack>
    </Paper>
  );
};
