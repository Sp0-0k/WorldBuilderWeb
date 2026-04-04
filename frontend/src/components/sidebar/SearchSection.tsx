import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Text, TextInput } from '@mantine/core';
import { Globe, Map as MapIcon, Building, MapPin, User, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dataService as APIService } from '../../data/dataService';
import type { BaseEntity, BaseEntityType } from '../../data/mockData';

interface SearchSectionProps {
  worldId: string;
}

const ENTITY_ICONS: Record<BaseEntityType, React.ReactNode> = {
  world:   <Globe size={14} />,
  country: <MapIcon size={14} />,
  city:    <Building size={14} />,
  poi:     <MapPin size={14} />,
  npc:     <User size={14} />,
};

export const SearchSection: React.FC<SearchSectionProps> = ({ worldId }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BaseEntity[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const found = await APIService.searchEntities(worldId, query);
      setResults(found);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, worldId]);

  return (
    <>
      <TextInput
        placeholder="Search entities..."
        size="sm"
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
        leftSection={<Search size={14} />}
        styles={{
          input: {
            backgroundColor: 'var(--mantine-color-darkGray-8)',
            borderColor: 'var(--mantine-color-brown-8)',
            color: 'var(--mantine-color-gray-2)',
          },
        }}
      />
      {query.trim() && results.length === 0 && (
        <Text size="xs" c="dimmed" fs="italic" mt="xs" px="xs">No results</Text>
      )}
      {results.map(entity => (
        <NavLink
          key={entity.id}
          label={entity.name}
          leftSection={ENTITY_ICONS[entity.type]}
          onClick={() => { navigate(`/view/${entity.type}/${entity.id}`); setQuery(''); }}
          styles={{ label: { fontSize: 13 } }}
        />
      ))}
    </>
  );
};
