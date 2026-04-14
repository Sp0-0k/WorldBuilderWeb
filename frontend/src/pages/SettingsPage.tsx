import React, { useEffect, useState } from "react";
import {
  Text,
  Divider,
  Stack,
  Group,
  Button,
  TextInput,
  NumberInput,
  Select,
  ActionIcon,
  Badge,
  Accordion,
  Switch,
} from "@mantine/core";
import { Plus, Trash2, Users, Shield, Bug } from "lucide-react";
import { useDebug } from "../contexts/DebugContext";
import { AnimatePresence, motion } from "framer-motion";
import { dataService as APIService } from "../data/dataService";
import type { PartyMember } from "../data/mockData";
import { FactionSettingsSection } from "./FactionSettingsSection";

const DND_CLASSES = [
  "Artificer",
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
  "Custom",
];

const DND_RACES = [
  "Dragonborn",
  "Dwarf",
  "Elf",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Halfling",
  "Human",
  "Tiefling",
  "Aasimar",
  "Goliath",
  "Tabaxi",
  "Kenku",
  "Lizardfolk",
  "Tortle",
  "Custom",
];

function blankMember(): PartyMember {
  return {
    id: "pm" + Math.random().toString(36).substring(2, 9),
    name: "",
    level: 1,
    className: "Fighter",
    race: "",
  };
}

export const SettingsPage: React.FC<{ worldId?: string | null }> = ({
  worldId,
}) => {
  const { debugMode, setDebugMode } = useDebug();
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!worldId) return;
    APIService.getParty(worldId).then((data) => {
      setMembers(data);
      setDirty(false);
    });
  }, [worldId]);

  const updateMember = (id: string, patch: Partial<PartyMember>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
    setDirty(true);
  };

  const addMember = () => {
    setMembers((prev) => [...prev, blankMember()]);
    setDirty(true);
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!worldId) return;
    setSaving(true);
    await APIService.saveParty(worldId, members);
    setSaving(false);
    setDirty(false);
  };

  const avgLevel = members.length
    ? Math.round(members.reduce((sum, m) => sum + m.level, 0) / members.length)
    : null;

  return (
    <Accordion
      multiple
      defaultValue={[]}
      chevronPosition="right"
      styles={{
        control: { padding: "8px 4px" },
        content: { padding: "4px 0 12px 0" },
        chevron: { color: "var(--mantine-color-dimmed)" },
      }}>
      <Accordion.Item value="party">
        <Accordion.Control>
          <Group gap="sm">
            <Users size={16} color="var(--mantine-color-gold-4)" />
            <Text size="sm" fw={600} c="gold.4">
              Adventuring Party
            </Text>
            {avgLevel !== null && (
              <Badge color="brown" variant="light" size="xs">
                Avg. Level {avgLevel}
              </Badge>
            )}
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Party details are used when generating shop inventories and NPC
              conversations — the AI will tailor item selection to your party's
              level, and NPCs will perceive the group by race and class (never
              by name, unless introduced in conversation).
            </Text>

            <Divider color="brown.9" />

            <AnimatePresence initial={false}>
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.15 }}>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                        Member {index + 1}
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        color="deepRed"
                        size="sm"
                        onClick={() => removeMember(member.id)}>
                        <Trash2 size={14} />
                      </ActionIcon>
                    </Group>
                    <Group grow align="flex-start">
                      <TextInput
                        placeholder="Character name"
                        size="sm"
                        value={member.name}
                        onChange={(e) =>
                          updateMember(member.id, {
                            name: e.currentTarget.value,
                          })
                        }
                      />
                      <NumberInput
                        placeholder="Lvl"
                        size="sm"
                        min={1}
                        max={20}
                        value={member.level}
                        onChange={(v) =>
                          updateMember(member.id, { level: Number(v) || 1 })
                        }
                        style={{ maxWidth: 80 }}
                      />
                    </Group>
                    <Group grow>
                      <Select
                        placeholder="Class"
                        size="sm"
                        data={DND_CLASSES}
                        value={member.className}
                        onChange={(v) =>
                          updateMember(member.id, { className: v ?? "Fighter" })
                        }
                      />
                      <Select
                        placeholder="Race"
                        size="sm"
                        data={DND_RACES}
                        value={member.race || null}
                        onChange={(v) =>
                          updateMember(member.id, { race: v ?? "" })
                        }
                      />
                    </Group>
                    {index < members.length - 1 && (
                      <Divider mt="xs" color="brown.9" />
                    )}
                  </Stack>
                </motion.div>
              ))}
            </AnimatePresence>

            {members.length === 0 && (
              <Text c="dimmed" fs="italic" size="sm" ta="center" py="xl">
                No party members yet. Add some to personalise AI-generated
                inventories.
              </Text>
            )}

            <Button
              variant="subtle"
              color="brown"
              leftSection={<Plus size={16} />}
              onClick={addMember}>
              Add Member
            </Button>

            <Divider color="brown.9" />

            <Group justify="flex-end">
              <Button
                color="forestGreen"
                loading={saving}
                disabled={!dirty}
                onClick={handleSave}>
                Save Party
              </Button>
            </Group>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {worldId && (
        <Accordion.Item value="factions">
          <Accordion.Control>
            <Group gap="sm">
              <Shield size={16} color="var(--mantine-color-gold-4)" />
              <Text size="sm" fw={600} c="gold.4">
                Factions
              </Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <FactionSettingsSection worldId={worldId} />
          </Accordion.Panel>
        </Accordion.Item>
      )}

      <Accordion.Item value="developer">
        <Accordion.Control>
          <Group gap="sm">
            <Bug size={16} color="var(--mantine-color-gold-4)" />
            <Text size="sm" fw={600} c="gold.4">
              Developer
            </Text>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Switch
            label="Show debug messages in console"
            description="Enables console.error output for caught exceptions"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.currentTarget.checked)}
            color="forestGreen"
          />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};
