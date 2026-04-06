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
      whileHover={{ y: -6, scale: 1.03, boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.1)' }}
      shadow="xl"
      radius="lg"
      p="xl"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: 'linear-gradient(145deg, rgba(35,39,44,0.9) 0%, rgba(20,22,25,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.3s ease'
      }}
      onClick={onClick}
    >
      <Group justify="space-between" mb="sm">
        <Text fw={800} ff="heading" size="xl" style={{
          background: 'linear-gradient(45deg, #fce89e, #c29707)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 2px 10px rgba(255,215,0,0.1)'
        }}>
          {title}
        </Text>
        <Group gap="xs">
          {onDelete && (
            <ActionIcon
              variant="subtle"
              color="deepRed"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 size={18} />
            </ActionIcon>
          )}
          {onClick && (
            <ActionIcon variant="subtle" color="gold">
              <ChevronRight size={22} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {tags && tags.length > 0 && (
        <Group gap="xs" mb="lg">
          {tags.map(tag => (
            <Badge key={tag} color="gold" variant="light" size="sm" radius="md" style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }}>
              {tag}
            </Badge>
          ))}
        </Group>
      )}

      <Text size="sm" c="gray.4" lineClamp={3}>
        {description}
      </Text>
    </Card>
  );
};
