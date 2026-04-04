import React, { useState } from 'react';
import { Modal, TextInput, Textarea, Button, Group, SegmentedControl, Text, Alert, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Wand2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SCHEMA_FIELDS } from '../../data/mockData';
import type { BaseEntityType } from '../../data/mockData';
import { generateEntity } from '../../data/AIService';

interface EntityContext {
  entity: any;
  parentChain: any[];
}

interface CreateEntityModalProps {
  opened: boolean;
  onClose: () => void;
  entityType: string;
  onSubmit: (data: any) => void;
  loading?: boolean;
  /** Full ancestor context passed down from EntityWorkspace for AI generation. */
  context?: EntityContext;
}

const AI_SUPPORTED_TYPES = new Set(['poi', 'npc']);

const namePlaceholderMap: Record<string, string> = {
  world:   'e.g. Oerth',
  country: 'e.g. The Iron Republic',
  city:    "e.g. Baldur's Gate",
  poi:     'e.g. The Prancing Pony',
  npc:     'e.g. Gandalf the Grey',
};

const aiPromptPlaceholderMap: Record<string, string> = {
  poi: 'e.g. "A low-end tavern on the outskirts of town" or "An enchanter\'s shop where magic weapons can be purchased"',
  npc: 'e.g. "A gruff dwarven blacksmith with a secret past" or "A charming elven spy working for the thieves\' guild"',
};

export const CreateEntityModal: React.FC<CreateEntityModalProps> = ({
  opened,
  onClose,
  entityType,
  onSubmit,
  loading = false,
  context,
}) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);

  const activeExtraFields = SCHEMA_FIELDS[entityType as BaseEntityType] || [];
  const supportsAI = AI_SUPPORTED_TYPES.has(entityType);

  const resetForm = () => {
    setName('');
    setDescription('');
    setExtraFields({});
    setAiPrompt('');
    setAiError(null);
    setMode('manual');
    setJustGenerated(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, description, ...extraFields });
    resetForm();
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim() || !context) return;
    setGenerating(true);
    setAiError(null);
    try {
      const result = await generateEntity(entityType as 'poi' | 'npc', aiPrompt, context);
      // Pre-fill form fields with AI result, then let the user review in manual mode
      setName(result.name ?? '');
      setDescription(result.description ?? '');
      const newExtras: Record<string, string> = {};
      for (const field of activeExtraFields) {
        newExtras[field] = result[field] ?? '';
      }
      setExtraFields(newExtras);
      setMode('manual');
      setJustGenerated(true);
      notifications.show({
        title: 'Generated!',
        message: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ready to review — edit if needed, then Create.`,
        color: 'gold',
        icon: <Wand2 size={16} />,
      });
    } catch (err: any) {
      setAiError(err?.message ?? 'Generation failed. Check your API key and try again.');
    }
    setGenerating(false);
  };

  const title = `Create New ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      centered
      styles={{
        title: {
          fontFamily: 'var(--mantine-font-family-headings)',
          color: 'var(--mantine-color-gold-4)',
          fontSize: 20,
        },
      }}
    >
      {supportsAI && (
        <SegmentedControl
          fullWidth
          mb="lg"
          value={mode}
          onChange={(v) => { setMode(v as 'manual' | 'ai'); setAiError(null); }}
          data={[
            { label: 'Manual', value: 'manual' },
            { label: '✦ AI Generate', value: 'ai' },
          ]}
          color="gold"
        />
      )}

      {/* ── AI Generate mode ── */}
      {mode === 'ai' && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Describe what you want to create. The world, country, and city context will be
            included automatically. The AI will fill in all fields — you can review and edit
            before saving.
          </Text>

          <Textarea
            label="What would you like to generate?"
            placeholder={aiPromptPlaceholderMap[entityType] ?? 'Describe the entity…'}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.currentTarget.value)}
            minRows={3}
            autosize
          />

          {aiError && (
            <Alert icon={<AlertCircle size={16} />} color="red" variant="light">
              {aiError}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={handleClose}>Cancel</Button>
            <Button
              color="gold"
              leftSection={<Wand2 size={16} />}
              loading={generating}
              disabled={!aiPrompt.trim()}
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </Group>
        </Stack>
      )}

      {/* ── Manual mode ── */}
      {mode === 'manual' && (
        <motion.form
          onSubmit={handleSubmit}
          initial={justGenerated ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <TextInput
            label="Name"
            placeholder={namePlaceholderMap[entityType] ?? `New ${entityType} name`}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            required
            mb="md"
          />

          <Textarea
            label="Description"
            placeholder="Briefly describe this entity…"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
            mb="md"
          />

          {activeExtraFields.map((field) => {
            const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
            return (
              <TextInput
                key={field}
                label={label}
                placeholder={`Enter ${label}…`}
                value={extraFields[field] ?? ''}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  setExtraFields((prev) => ({ ...prev, [field]: val }));
                }}
                mb="md"
              />
            );
          })}

          <Group justify="flex-end" mt="lg">
            <Button variant="subtle" color="gray" onClick={handleClose}>Cancel</Button>
            <Button color="forestGreen" type="submit" loading={loading} disabled={!name.trim()}>
              Create
            </Button>
          </Group>
        </motion.form>
      )}
    </Modal>
  );
};
