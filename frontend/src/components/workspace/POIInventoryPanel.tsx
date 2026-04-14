import React, { useEffect, useState } from 'react';
import {
  Paper, Title, Text, Group, Button, Stack, Badge, ActionIcon,
  TextInput, Textarea, Select, Divider, NumberInput, Switch,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Plus, Pencil, Trash2, Wand2, Check, X, GripVertical } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { dataService as APIService } from '../../data/dataService';
import { generateInventory } from '../../data/AIService';
import { useDebug } from '../../contexts/DebugContext';
import type { AnyEntity, InventoryItem, PartyMember, POI } from '../../data/mockData';

// ── Rarity colours ────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  Common:      'gray',
  Uncommon:    'forestGreen',
  Rare:        'blue',
  'Very Rare': 'deepRed',
  Legendary:   'gold',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface POIInventoryPanelProps {
  entity: POI;
  isEditing: boolean;
  parentChain: AnyEntity[];
  /** Called after inventoryEnabled is toggled so the parent's entity state stays in sync. */
  onEntityUpdate: (updated: POI) => void;
}

interface EditingItem {
  name: string;
  description: string;
  stats: string;
  price: string;
  rarity: string;
}

const BLANK_ITEM: EditingItem = { name: '', description: '', stats: '', price: '', rarity: 'Common' };

// ── Sortable item row ─────────────────────────────────────────────────────────

interface SortableRowProps {
  item: InventoryItem;
  isEditing: boolean;
  editingId: string | null;
  editDraft: EditingItem;
  onEditDraftChange: (d: EditingItem) => void;
  onStartEdit: (item: InventoryItem) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
  item, isEditing, editingId, editDraft, onEditDraftChange,
  onStartEdit, onSaveEdit, onCancelEdit, onDelete,
}) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.id });

  const dndStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
  };

  const isEditingThis = editingId === item.id;

  return (
    <div ref={setNodeRef} style={dndStyle}>
      {isEditingThis ? (
        // ── Inline edit form ──
        <Paper p="sm" withBorder>
          <Stack gap="xs">
            <Group grow>
              <TextInput
                size="xs"
                placeholder="Name"
                value={editDraft.name}
                onChange={e => onEditDraftChange({ ...editDraft, name: e.currentTarget.value })}
              />
              <TextInput
                size="xs"
                placeholder="Price (e.g. 5 gp)"
                value={editDraft.price}
                onChange={e => onEditDraftChange({ ...editDraft, price: e.currentTarget.value })}
              />
              <Select
                size="xs"
                data={['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary']}
                value={editDraft.rarity}
                onChange={v => onEditDraftChange({ ...editDraft, rarity: v ?? 'Common' })}
              />
            </Group>
            <Textarea
              size="xs"
              placeholder="Flavor / lore description"
              value={editDraft.description}
              onChange={e => onEditDraftChange({ ...editDraft, description: e.currentTarget.value })}
              minRows={2}
              autosize
            />
            <TextInput
              size="xs"
              placeholder="Stats (e.g. 1d8 slashing, versatile (1d10)) — leave blank for non-combat items"
              value={editDraft.stats}
              onChange={e => onEditDraftChange({ ...editDraft, stats: e.currentTarget.value })}
            />
            <Group justify="flex-end" gap="xs">
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={onCancelEdit}>
                <X size={14} />
              </ActionIcon>
              <ActionIcon variant="filled" color="forestGreen" size="sm" onClick={() => onSaveEdit(item.id)}>
                <Check size={14} />
              </ActionIcon>
            </Group>
          </Stack>
        </Paper>
      ) : (
        // ── View row ──
        <Paper p="sm" withBorder>
          <Group justify="space-between" wrap="nowrap">
            {/* Drag handle — only in edit mode */}
            {isEditing && (
              <ActionIcon
                variant="transparent"
                color="gray"
                size="sm"
                style={{ cursor: 'grab', touchAction: 'none', flexShrink: 0 }}
                {...attributes}
                {...listeners}
              >
                <GripVertical size={16} />
              </ActionIcon>
            )}

            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs" wrap="nowrap">
                <Text fw={600} size="sm" style={{ whiteSpace: 'nowrap' }}>{item.name}</Text>
                <Badge size="xs" color={RARITY_COLORS[item.rarity] ?? 'gray'} variant="light">
                  {item.rarity}
                </Badge>
                <Text size="xs" c="gold.4" style={{ whiteSpace: 'nowrap' }}>{item.price}</Text>
              </Group>
              {item.stats && (
                <Text size="xs" c="brown.3" ff="monospace">{item.stats}</Text>
              )}
              <Text size="xs" c="dimmed" lineClamp={2}>{item.description}</Text>
            </Stack>

            {isEditing && (
              <Group gap="xs" style={{ flexShrink: 0 }}>
                <ActionIcon variant="subtle" color="brown" size="sm" onClick={() => onStartEdit(item)}>
                  <Pencil size={14} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="deepRed" size="sm" onClick={() => onDelete(item.id)}>
                  <Trash2 size={14} />
                </ActionIcon>
              </Group>
            )}
          </Group>
        </Paper>
      )}
    </div>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────

export const POIInventoryPanel: React.FC<POIInventoryPanelProps> = ({
  entity, isEditing, parentChain, onEntityUpdate,
}) => {
  const { debugMode } = useDebug();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline add form
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<EditingItem>(BLANK_ITEM);
  const [addingSaving, setAddingSaving] = useState(false);

  // Per-item inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditingItem>(BLANK_ITEM);

  // AI generation
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [party, setParty] = useState<PartyMember[]>([]);

  // Toggle state — mirrors entity.inventoryEnabled
  const [enabled, setEnabled] = useState<boolean>(!!entity.inventoryEnabled);
  const [toggling, setToggling] = useState(false);

  // Keep enabled in sync if parent entity prop changes
  useEffect(() => {
    queueMicrotask(() => setEnabled(!!entity.inventoryEnabled));
  }, [entity.inventoryEnabled]);

  useEffect(() => {
    const worldId = parentChain[0]?.id;
    if (worldId) APIService.getParty(worldId).then(setParty);
  }, [parentChain]);

  useEffect(() => {
    if (!enabled) { queueMicrotask(() => setLoading(false)); return; }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    APIService.getInventory(entity.id).then(data => {
      if (!cancelled) { setItems(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [entity.id, enabled]);

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  // ── Toggle inventory enabled ────────────────────────────────────────────────

  const handleToggle = async (next: boolean) => {
    setToggling(true);
    try {
      const updated = await APIService.updateEntity('poi', entity.id, { inventoryEnabled: next });
      setEnabled(next);
      onEntityUpdate(updated);
    } catch (e) { if (debugMode) console.error(e); }
    setToggling(false);
  };

  // ── Add ─────────────────────────────────────────────────────────────────────

  const handleAddSave = async () => {
    if (!newItem.name.trim()) return;
    setAddingSaving(true);
    try {
      const created = await APIService.addInventoryItem({ ...newItem, poiId: entity.id });
      setItems(prev => [...prev, created]);
      setNewItem(BLANK_ITEM);
      setAddingItem(false);
    } catch (e) { if (debugMode) console.error(e); }
    setAddingSaving(false);
  };

  // ── Edit ────────────────────────────────────────────────────────────────────

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditDraft({ name: item.name, description: item.description, stats: item.stats ?? '', price: item.price, rarity: item.rarity });
  };

  const handleEditSave = async (id: string) => {
    try {
      const updated = await APIService.updateInventoryItem(id, editDraft);
      setItems(prev => prev.map(i => i.id === id ? updated : i));
      setEditingId(null);
    } catch (e) { if (debugMode) console.error(e); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await APIService.deleteInventoryItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { if (debugMode) console.error(e); }
  };

  // ── Drag to reorder ─────────────────────────────────────────────────────────

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems(prev => {
      const oldIndex = prev.findIndex(i => i.id === active.id);
      const newIndex = prev.findIndex(i => i.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      APIService.reorderInventory(entity.id, reordered.map(i => i.id));
      return reordered;
    });
  };

  // ── AI Generation ────────────────────────────────────────────────────────────

  const runGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await generateInventory(
        entity,
        { entity: null, parentChain },
        party,
        generateCount,
        items,
      );
      const saved = await Promise.all(
        generated.map(item => APIService.addInventoryItem({ ...item, poiId: entity.id }))
      );
      setItems(prev => [...prev, ...saved]);
      notifications.show({
        title: 'Items Generated!',
        message: `${saved.length} item${saved.length !== 1 ? 's' : ''} added to ${entity.name}`,
        color: 'gold',
        icon: <Wand2 size={16} />,
      });
    } catch (err: unknown) {
      notifications.show({
        title: 'Generation failed',
        message: err instanceof Error ? err.message : 'Something went wrong. Check your API key.',
        color: 'red',
      });
    }
    setGenerating(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Paper mt="xl" p="xl" radius="md">
        {/* Header */}
        <Group justify="space-between" mb={enabled ? 'md' : 0}>
          <Title order={3} ff="heading" c="gold.4">Inventory</Title>
          <Group gap="sm">
            {/* Generate controls — edit mode only */}
            {isEditing && enabled && (
              <Group gap="xs">
                <NumberInput
                  size="xs"
                  min={1}
                  max={10}
                  value={generateCount}
                  onChange={v => setGenerateCount(typeof v === 'number' ? v : 5)}
                  w={64}
                  allowDecimal={false}
                  hideControls={false}
                  styles={{ input: { textAlign: 'center' } }}
                />
                <Button
                  variant="light"
                  color="gold"
                  size="sm"
                  leftSection={<Wand2 size={16} />}
                  loading={generating}
                  onClick={runGenerate}
                >
                  Generate Items
                </Button>
              </Group>
            )}
            {/* Enable/disable toggle — edit mode only */}
            {isEditing && (
              <Switch
                label="Enable"
                checked={enabled}
                onChange={e => handleToggle(e.currentTarget.checked)}
                disabled={toggling}
                color="gold"
                size="sm"
              />
            )}
          </Group>
        </Group>

        {/* Body — only shown when enabled */}
        {enabled && (
          loading ? (
            <Text c="dimmed" fs="italic" size="sm">Loading…</Text>
          ) : (
            <Stack gap="xs">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SortableRow
                          item={item}
                          isEditing={isEditing}
                          editingId={editingId}
                          editDraft={editDraft}
                          onEditDraftChange={setEditDraft}
                          onStartEdit={startEdit}
                          onSaveEdit={handleEditSave}
                          onCancelEdit={() => setEditingId(null)}
                          onDelete={handleDelete}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>

              {items.length === 0 && !addingItem && (
                <Text c="dimmed" fs="italic" size="sm">
                  No items yet. {isEditing ? 'Add one manually or generate with AI.' : ''}
                </Text>
              )}

              {/* Add item form */}
              <AnimatePresence>
                {addingItem && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Divider my="xs" />
                    <Paper p="sm" withBorder>
                      <Stack gap="xs">
                        <Group grow>
                          <TextInput
                            size="xs"
                            placeholder="Item name"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.currentTarget.value })}
                          />
                          <TextInput
                            size="xs"
                            placeholder="Price (e.g. 5 gp)"
                            value={newItem.price}
                            onChange={e => setNewItem({ ...newItem, price: e.currentTarget.value })}
                          />
                          <Select
                            size="xs"
                            data={['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary']}
                            value={newItem.rarity}
                            onChange={v => setNewItem({ ...newItem, rarity: v ?? 'Common' })}
                          />
                        </Group>
                        <Textarea
                          size="xs"
                          placeholder="Flavor / lore description…"
                          value={newItem.description}
                          onChange={e => setNewItem({ ...newItem, description: e.currentTarget.value })}
                          minRows={2}
                          autosize
                        />
                        <TextInput
                          size="xs"
                          placeholder="Stats (e.g. 1d8 slashing, versatile (1d10)) — leave blank for non-combat items"
                          value={newItem.stats}
                          onChange={e => setNewItem({ ...newItem, stats: e.currentTarget.value })}
                        />
                        <Group justify="flex-end" gap="xs">
                          <Button size="xs" variant="subtle" color="gray"
                            onClick={() => { setAddingItem(false); setNewItem(BLANK_ITEM); }}>
                            Cancel
                          </Button>
                          <Button
                            size="xs"
                            color="forestGreen"
                            leftSection={<Plus size={12} />}
                            loading={addingSaving}
                            disabled={!newItem.name.trim()}
                            onClick={handleAddSave}
                          >
                            Add
                          </Button>
                        </Group>
                      </Stack>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add item button — edit mode only */}
              {isEditing && !addingItem && (
                <Button
                  variant="subtle"
                  color="brown"
                  size="xs"
                  leftSection={<Plus size={14} />}
                  onClick={() => setAddingItem(true)}
                  mt="xs"
                >
                  Add Item
                </Button>
              )}
            </Stack>
          )
        )}
      </Paper>
    </>
  );
};
