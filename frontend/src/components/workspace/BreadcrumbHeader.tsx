import React from 'react';
import { Group, ActionIcon, Breadcrumbs, Anchor, Text, Tooltip } from '@mantine/core';
import { ArrowLeft, Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BaseEntity } from '../../data/mockData';

interface BreadcrumbHeaderProps {
  entity: BaseEntity | null;
  parentChain: BaseEntity[]; // [World, Country, City] ordered top-down
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const BreadcrumbHeader: React.FC<BreadcrumbHeaderProps> = ({ entity, parentChain, isPinned, onTogglePin }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (parentChain.length > 0) {
      const immediateParent = parentChain[parentChain.length - 1];
      navigate(`/view/${immediateParent.type}/${immediateParent.id}`);
    } else {
      navigate('/');
    }
  };

  const items = parentChain.map((p) => (
    <Anchor 
      key={p.id} 
      onClick={() => navigate(`/view/${p.type}/${p.id}`)}
      c="dimmed"
      size="sm"
    >
      {p.name}
    </Anchor>
  ));

  if (entity) {
    items.push(<Text key={entity.id} size="sm" c="gold.4" fw={500}>{entity.name}</Text>);
  }

  return (
    <Group mb="lg" gap="md">
      <ActionIcon
        variant="light"
        color="brown"
        size="lg"
        radius="md"
        onClick={handleBack}
        aria-label="Go Back"
      >
        <ArrowLeft size={20} />
      </ActionIcon>

      {onTogglePin && (
        <Tooltip label={isPinned ? 'Unpin' : 'Pin'} position="bottom">
          <ActionIcon
            variant={isPinned ? 'filled' : 'subtle'}
            color={isPinned ? 'gold' : 'gray'}
            size="lg"
            radius="md"
            onClick={onTogglePin}
            aria-label={isPinned ? 'Unpin entity' : 'Pin entity'}
          >
            <Pin size={16} />
          </ActionIcon>
        </Tooltip>
      )}

      <div>
        <Breadcrumbs separator="→" mt="xs">
          {items}
        </Breadcrumbs>
      </div>
    </Group>
  );
};
