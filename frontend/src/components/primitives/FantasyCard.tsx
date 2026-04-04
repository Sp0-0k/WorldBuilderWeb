import React from 'react';
import { Card, Text, Badge, Group, ActionIcon } from '@mantine/core';
import { ChevronRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FantasyCardProps {
  title: string;
  description: string;
  tags?: string[];
  onClick?: () => void;
  onDelete?: () => void;
}

export const FantasyCard: React.FC<FantasyCardProps> = ({ title, description, tags, onClick, onDelete }) => {
  return (
    <Card
      component={motion.div}
      whileHover={{ y: -4, scale: 1.02 }}
      withBorder
      shadow="sm"
      radius="md"
      p="lg"
      style={{ cursor: onClick ? 'pointer' : 'default', borderColor: 'var(--mantine-color-brown-7)' }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="xs">
        <Text fw={700} ff="heading" size="xl" c="gold.4">{title}</Text>
        <Group gap="xs">
          {onDelete && (
            <ActionIcon
              variant="subtle"
              color="deepRed"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 size={16} />
            </ActionIcon>
          )}
          {onClick && (
            <ActionIcon variant="subtle" color="gold">
              <ChevronRight size={20} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {tags && tags.length > 0 && (
        <Group gap="xs" mb="md">
          {tags.map(tag => (
            <Badge key={tag} color="brown" variant="outline" radius="sm">
              {tag}
            </Badge>
          ))}
        </Group>
      )}

      <Text size="sm" c="dimmed" lineClamp={3}>
        {description}
      </Text>
    </Card>
  );
};
