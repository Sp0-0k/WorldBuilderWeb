import React, { useEffect, useState } from 'react';
import {
  Drawer, Title, Text, Group, Button, Stack, TextInput,
  NumberInput, Select, ActionIcon, Divider, Badge,
} from '@mantine/core';
import { Plus, Trash2, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { APIService } from '../../data/MockDataService';
import type { PartyMember } from '../../data/mockData';

const DND_CLASSES = [
  'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid',
  'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue',
  'Sorcerer', 'Warlock', 'Wizard', 'Custom',
];

interface PartyPanelProps {
  opened: boolean;
  onClose: () => void;
}

function blankMember(): PartyMember {
  return { id: 'pm' + Math.random().toString(36).substring(2, 9), name: '', level: 1, className: 'Fighter' };
}

export const PartyPanel: React.FC<PartyPanelProps> = ({ opened, onClose }) => {
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load party when drawer opens
  useEffect(() => {
    if (opened) {
      APIService.getParty().then(data => {
        setMembers(data);
        setDirty(false);
      });
    }
  }, [opened]);

  const updateMember = (id: string, patch: Partial<PartyMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    setDirty(true);
  };

  const addMember = () => {
    setMembers(prev => [...prev, blankMember()]);
    setDirty(true);
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await APIService.saveParty(members);
    setSaving(false);
    setDirty(false);
    onClose();
  };

  const avgLevel = members.length
    ? Math.round(members.reduce((sum, m) => sum + m.level, 0) / members.length)
    : null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Users size={20} color="var(--mantine-color-gold-4)" />
          <Title order={4} ff="heading" c="gold.4">Adventuring Party</Title>
          {avgLevel !== null && (
            <Badge color="brown" variant="light" size="sm">Avg. Level {avgLevel}</Badge>
          )}
        </Group>
      }
      position="right"
      size="md"
      styles={{
        content: { backgroundColor: 'var(--mantine-color-darkGray-9)' },
        header: { backgroundColor: 'var(--mantine-color-darkGray-9)', borderBottomColor: 'var(--mantine-color-brown-9)', borderBottomWidth: 1, borderBottomStyle: 'solid' },
      }}
    >
      <Stack gap="md" pt="md">
        <Text size="sm" c="dimmed">
          Party details are used when generating shop inventories — the AI will tailor item
          selection, pricing, and rarity to suit your party's level and composition.
        </Text>

        <Divider />

        <AnimatePresence initial={false}>
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                    Member {index + 1}
                  </Text>
                  <ActionIcon variant="subtle" color="deepRed" size="sm" onClick={() => removeMember(member.id)}>
                    <Trash2 size={14} />
                  </ActionIcon>
                </Group>
                <Group grow align="flex-start">
                  <TextInput
                    placeholder="Character name"
                    size="sm"
                    value={member.name}
                    onChange={e => updateMember(member.id, { name: e.currentTarget.value })}
                  />
                  <NumberInput
                    placeholder="Lvl"
                    size="sm"
                    min={1}
                    max={20}
                    value={member.level}
                    onChange={v => updateMember(member.id, { level: Number(v) || 1 })}
                    style={{ maxWidth: 80 }}
                  />
                </Group>
                <Select
                  placeholder="Class"
                  size="sm"
                  data={DND_CLASSES}
                  value={member.className}
                  onChange={v => updateMember(member.id, { className: v ?? 'Fighter' })}
                />
                {index < members.length - 1 && <Divider mt="xs" />}
              </Stack>
            </motion.div>
          ))}
        </AnimatePresence>

        {members.length === 0 && (
          <Text c="dimmed" fs="italic" size="sm" ta="center" py="xl">
            No party members yet. Add some to personalise AI-generated inventories.
          </Text>
        )}

        <Button
          variant="subtle"
          color="brown"
          leftSection={<Plus size={16} />}
          onClick={addMember}
        >
          Add Member
        </Button>

        <Divider />

        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onClose}>Discard</Button>
          <Button color="forestGreen" loading={saving} disabled={!dirty} onClick={handleSave}>
            Save Party
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
