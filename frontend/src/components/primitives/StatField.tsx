import React from 'react';
import { TextInput, Text, Stack } from '@mantine/core';

interface StatFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (val: string) => void;
}

export const StatField: React.FC<StatFieldProps> = ({ label, value, isEditing, onChange }) => {
  if (isEditing) {
    return (
      <TextInput
        label={label}
        value={value}
        onChange={(e) => onChange?.(e.currentTarget.value)}
        variant="filled"
        radius="md"
      />
    );
  }

  return (
    <Stack gap={2}>
      <Text size="xs" tt="uppercase" c="dimmed" fw={600}>{label}</Text>
      <Text size="md">{value || 'None'}</Text>
    </Stack>
  );
};
