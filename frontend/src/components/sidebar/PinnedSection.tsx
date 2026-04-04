import React from 'react';
import { ActionIcon, NavLink, Text } from '@mantine/core';
import { Globe, Map as MapIcon, Building, MapPin, User, PinOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BaseEntity, BaseEntityType } from '../../data/mockData';

interface PinnedSectionProps {
  pins: BaseEntity[];
  currentEntityId: string;
  onUnpin: (id: string) => void;
}

const ENTITY_ICONS: Record<BaseEntityType, React.ReactNode> = {
  world:   <Globe size={14} />,
  country: <MapIcon size={14} />,
  city:    <Building size={14} />,
  poi:     <MapPin size={14} />,
  npc:     <User size={14} />,
};

export const PinnedSection: React.FC<PinnedSectionProps> = ({ pins, currentEntityId, onUnpin }) => {
  const navigate = useNavigate();

  if (pins.length === 0) {
    return (
      <Text size="xs" c="dimmed" fs="italic" px="xs" py="xs">
        No pinned entities
      </Text>
    );
  }

  return (
    <>
      {pins.map(entity => (
        <NavLink
          key={entity.id}
          label={entity.name}
          active={entity.id === currentEntityId}
          color="gold"
          leftSection={ENTITY_ICONS[entity.type]}
          rightSection={
            <ActionIcon
              variant="subtle"
              color="dimmed"
              size="xs"
              onClick={e => { e.stopPropagation(); onUnpin(entity.id); }}
              aria-label="Unpin"
            >
              <PinOff size={12} />
            </ActionIcon>
          }
          onClick={() => navigate(`/view/${entity.type}/${entity.id}`)}
          styles={{ label: { fontSize: 13 } }}
        />
      ))}
    </>
  );
};
