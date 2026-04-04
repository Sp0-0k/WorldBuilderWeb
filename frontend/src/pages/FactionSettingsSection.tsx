import React, { useEffect, useState } from 'react';
import {
  Stack, Group, Text, Title, Divider, Button, TextInput, Textarea,
  ActionIcon, Badge, Select, Accordion, Skeleton,
} from '@mantine/core';
import { Plus, Trash2, Edit2, Save, X, Shield, Users } from 'lucide-react';
import { APIService } from '../data/MockDataService';
import type { Faction, City, NPC } from '../data/mockData';

interface Props {
  worldId: string;
}

export const FactionSettingsSection: React.FC<Props> = ({ worldId }) => {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Faction>>({});
  const [saving, setSaving] = useState(false);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', description: '', powerLevel: '', strongholdCityId: '' });
  const [creating, setCreating] = useState(false);

  const [addMemberFor, setAddMemberFor] = useState<string | null>(null);
  const [addNpcId, setAddNpcId] = useState('');
  const [addRole, setAddRole] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      APIService.getFactions(worldId),
      APIService.getCitiesForWorld(worldId),
      APIService.getNPCsForWorld(worldId),
    ]).then(([f, c, n]) => {
      setFactions(f);
      setCities(c);
      setNpcs(n);
      setLoading(false);
    });
  }, [worldId]);

  const handleCreate = async () => {
    if (!newForm.name.trim()) return;
    setCreating(true);
    const created = await APIService.createFaction({ ...newForm, worldId, members: [] });
    setFactions(prev => [...prev, created]);
    setNewForm({ name: '', description: '', powerLevel: '', strongholdCityId: '' });
    setShowNewForm(false);
    setCreating(false);
  };

  const startEdit = (faction: Faction) => {
    setEditingId(faction.id);
    setEditDraft({
      name: faction.name,
      description: faction.description,
      powerLevel: faction.powerLevel,
      strongholdCityId: faction.strongholdCityId,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const updated = await APIService.updateFaction(editingId, editDraft);
    setFactions(prev => prev.map(f => f.id === editingId ? updated : f));
    setEditingId(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await APIService.deleteFaction(id);
    setFactions(prev => prev.filter(f => f.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAddMember = async (factionId: string) => {
    if (!addNpcId) return;
    setAddingMember(true);
    await APIService.addNPCToFaction(factionId, addNpcId, addRole);
    const updated = await APIService.getFactions(worldId);
    setFactions(updated);
    setAddMemberFor(null);
    setAddNpcId('');
    setAddRole('');
    setAddingMember(false);
  };

  const handleRemoveMember = async (factionId: string, npcId: string) => {
    await APIService.removeNPCFromFaction(factionId, npcId);
    const updated = await APIService.getFactions(worldId);
    setFactions(updated);
  };

  const getNpcName = (npcId: string) => npcs.find(n => n.id === npcId)?.name ?? npcId;
  const getCityName = (cityId: string) => cities.find(c => c.id === cityId)?.name ?? '';

  return (
    <Stack gap="md">
      <Group gap="sm" mb="xs">
        <Shield size={20} color="var(--mantine-color-gold-4)" />
        <Title order={4} ff="heading" c="gold.4">Factions</Title>
      </Group>

      <Text size="sm" c="dimmed">
        Factions are power groups within the world — guilds, cults, noble houses, or secret societies.
        Link them to cities and NPCs to map their reach and influence.
      </Text>

      <Divider color="brown.9" />

      {loading && <Skeleton height={60} radius="md" />}

      {!loading && factions.length === 0 && !showNewForm && (
        <Text c="dimmed" fs="italic" size="sm" ta="center" py="sm">
          No factions yet.
        </Text>
      )}

      {!loading && factions.length > 0 && (
        <Accordion
          chevronPosition="right"
          styles={{
            control: { padding: '6px 4px' },
            content: { padding: '0 0 8px 0' },
            chevron: { color: 'var(--mantine-color-dimmed)' },
          }}
        >
          {factions.map(faction => (
            <Accordion.Item key={faction.id} value={faction.id}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" pr="xs">
                  <Group gap="xs">
                    <Text fw={600} size="sm">{faction.name}</Text>
                    {faction.powerLevel && (
                      <Badge color="brown" variant="light" size="xs">{faction.powerLevel}</Badge>
                    )}
                  </Group>
                  <Group gap={4} onClick={e => e.stopPropagation()}>
                    <ActionIcon
                      variant="subtle" color="brown" size="sm"
                      onClick={() => editingId === faction.id ? setEditingId(null) : startEdit(faction)}
                      title="Edit faction"
                    >
                      <Edit2 size={13} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle" color="deepRed" size="sm"
                      onClick={() => handleDelete(faction.id)}
                      title="Delete faction"
                    >
                      <Trash2 size={13} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Accordion.Control>

              <Accordion.Panel>
                {editingId === faction.id ? (
                  <Stack gap="xs" pb="xs">
                    <TextInput
                      label="Name" size="xs"
                      value={editDraft.name ?? ''}
                      onChange={e => setEditDraft({ ...editDraft, name: e.currentTarget.value })}
                    />
                    <Textarea
                      label="Description" size="xs" minRows={2} autosize
                      value={editDraft.description ?? ''}
                      onChange={e => setEditDraft({ ...editDraft, description: e.currentTarget.value })}
                    />
                    <Group grow>
                      <TextInput
                        label="Power Level" size="xs" placeholder="High / Medium / Low…"
                        value={editDraft.powerLevel ?? ''}
                        onChange={e => setEditDraft({ ...editDraft, powerLevel: e.currentTarget.value })}
                      />
                      <Select
                        label="Stronghold City" size="xs" placeholder="Select city…" clearable
                        data={cities.map(c => ({ value: c.id, label: c.name }))}
                        value={editDraft.strongholdCityId ?? ''}
                        onChange={v => setEditDraft({ ...editDraft, strongholdCityId: v ?? '' })}
                      />
                    </Group>
                    <Group justify="flex-end" gap="xs">
                      <Button size="xs" variant="subtle" color="gray" onClick={() => setEditingId(null)} leftSection={<X size={12} />}>Cancel</Button>
                      <Button size="xs" color="forestGreen" loading={saving} onClick={handleSaveEdit} leftSection={<Save size={12} />}>Save</Button>
                    </Group>
                  </Stack>
                ) : (
                  <Stack gap="xs" pb="xs">
                    {faction.description && <Text size="sm">{faction.description}</Text>}
                    {faction.strongholdCityId && (
                      <Group gap="xs">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Stronghold:</Text>
                        <Text size="sm">{getCityName(faction.strongholdCityId)}</Text>
                      </Group>
                    )}

                    <Group gap="xs" mt="xs">
                      <Users size={13} color="var(--mantine-color-dimmed)" />
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Members</Text>
                    </Group>

                    {faction.members.length === 0 && (
                      <Text size="sm" c="dimmed" fs="italic">No members assigned.</Text>
                    )}

                    {faction.members.map(m => (
                      <Group key={m.npcId} justify="space-between" wrap="nowrap" gap="xs">
                        <Group gap="xs">
                          <Text size="sm" fw={500}>{getNpcName(m.npcId)}</Text>
                          {m.role && <Text size="sm" c="dimmed">— {m.role}</Text>}
                        </Group>
                        <ActionIcon variant="subtle" color="deepRed" size="xs" onClick={() => handleRemoveMember(faction.id, m.npcId)}>
                          <X size={12} />
                        </ActionIcon>
                      </Group>
                    ))}

                    {addMemberFor === faction.id ? (
                      <Stack gap="xs" mt="xs">
                        {npcs.filter(n => !faction.members.some(m => m.npcId === n.id)).length === 0 ? (
                          <Text size="sm" c="dimmed" fs="italic">All world NPCs are already members.</Text>
                        ) : (
                          <Group grow align="flex-end">
                            <Select
                              label="NPC" size="xs" placeholder="Select NPC…"
                              data={npcs
                                .filter(n => !faction.members.some(m => m.npcId === n.id))
                                .map(n => ({ value: n.id, label: n.name }))}
                              value={addNpcId}
                              onChange={v => setAddNpcId(v ?? '')}
                            />
                            <TextInput
                              label="Role" size="xs" placeholder="e.g., Spy, Leader…"
                              value={addRole}
                              onChange={e => setAddRole(e.currentTarget.value)}
                            />
                          </Group>
                        )}
                        <Group gap="xs" justify="flex-end">
                          <Button size="xs" variant="subtle" color="gray" onClick={() => { setAddMemberFor(null); setAddNpcId(''); setAddRole(''); }}>
                            Cancel
                          </Button>
                          <Button size="xs" color="forestGreen" loading={addingMember} disabled={!addNpcId} onClick={() => handleAddMember(faction.id)}>
                            Add
                          </Button>
                        </Group>
                      </Stack>
                    ) : (
                      <Button
                        size="xs" variant="subtle" color="brown"
                        leftSection={<Plus size={12} />}
                        onClick={() => { setAddMemberFor(faction.id); setAddNpcId(''); setAddRole(''); }}
                      >
                        Add Member
                      </Button>
                    )}
                  </Stack>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      {!loading && showNewForm && (
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" c="dimmed" fw={600}>New Faction</Text>
          <TextInput
            label="Name" size="sm" placeholder="Faction name…"
            value={newForm.name}
            onChange={e => setNewForm({ ...newForm, name: e.currentTarget.value })}
          />
          <Textarea
            label="Description" size="sm" minRows={2} autosize
            value={newForm.description}
            onChange={e => setNewForm({ ...newForm, description: e.currentTarget.value })}
          />
          <Group grow>
            <TextInput
              label="Power Level" size="sm" placeholder="High / Medium / Low…"
              value={newForm.powerLevel}
              onChange={e => setNewForm({ ...newForm, powerLevel: e.currentTarget.value })}
            />
            <Select
              label="Stronghold City" size="sm" placeholder="Select city…" clearable
              data={cities.map(c => ({ value: c.id, label: c.name }))}
              value={newForm.strongholdCityId}
              onChange={v => setNewForm(p => ({ ...p, strongholdCityId: v ?? '' }))}
            />
          </Group>
          <Group justify="flex-end" gap="xs">
            <Button size="sm" variant="subtle" color="gray" onClick={() => setShowNewForm(false)}>Cancel</Button>
            <Button
              size="sm" color="forestGreen" loading={creating}
              disabled={!newForm.name.trim()} onClick={handleCreate}
            >
              Create Faction
            </Button>
          </Group>
        </Stack>
      )}

      {!loading && !showNewForm && (
        <Button variant="subtle" color="brown" leftSection={<Plus size={16} />} onClick={() => setShowNewForm(true)}>
          Add Faction
        </Button>
      )}
    </Stack>
  );
};
