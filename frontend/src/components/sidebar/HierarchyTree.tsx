import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader, NavLink } from '@mantine/core';
import { Globe, Map as MapIcon, Building, MapPin, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../../data/MockDataService';
import { getChildType } from '../../data/mockData';
import type { BaseEntity, BaseEntityType } from '../../data/mockData';

interface HierarchyTreeProps {
  worldId: string;
  currentEntityId: string;
  ancestorIds: string[];
}

interface NodeState {
  entity: BaseEntity;
  childIds: string[] | null; // null = not yet loaded
  isExpanded: boolean;
  isLoading: boolean;
}

const ENTITY_ICONS: Record<BaseEntityType, React.ReactNode> = {
  world:   <Globe size={14} />,
  country: <MapIcon size={14} />,
  city:    <Building size={14} />,
  poi:     <MapPin size={14} />,
  npc:     <User size={14} />,
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ worldId, currentEntityId, ancestorIds }) => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Map<string, NodeState>>(new Map());

  // Keep a ref so async callbacks can read latest nodes without stale closures
  const nodesRef = useRef<Map<string, NodeState>>(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const expandNodeById = useCallback(async (id: string, forceExpand = false) => {
    const node = nodesRef.current.get(id);
    if (!node) return;

    if (node.childIds !== null) {
      if (forceExpand && !node.isExpanded) {
        const next = new Map(nodesRef.current);
        const n = next.get(id);
        if (n) {
          next.set(id, { ...n, isExpanded: true });
          nodesRef.current = next;
          setNodes(next);
        }
      } else if (!forceExpand) {
        const next = new Map(nodesRef.current);
        const n = next.get(id);
        if (n) {
           next.set(id, { ...n, isExpanded: !n.isExpanded });
           nodesRef.current = next;
           setNodes(next);
        }
      }
      return;
    }

    const childType = getChildType(node.entity.type);
    if (!childType) {
      const next = new Map(nodesRef.current);
      const n = next.get(id);
      if (n) {
        next.set(id, { ...n, childIds: [], isExpanded: true });
        nodesRef.current = next;
        setNodes(next);
      }
      return;
    }

    let next = new Map(nodesRef.current);
    let n = next.get(id);
    if (n) {
      next.set(id, { ...n, isLoading: true });
      nodesRef.current = next;
      setNodes(next);
    }

    const children = await APIService.getChildren(node.entity.type, id, childType);

    next = new Map(nodesRef.current);
    for (const c of children) {
      if (!next.has(c.id)) {
        next.set(c.id, { entity: c, childIds: null, isExpanded: false, isLoading: false });
      }
    }
    const parent = next.get(id);
    if (parent) {
      next.set(id, { ...parent, childIds: children.map(c => c.id), isExpanded: true, isLoading: false });
    }
    nodesRef.current = next;
    setNodes(next);
  }, []);

  // Effect 1: Full reset only when the world changes
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const world = await APIService.getEntityByRoute('world', worldId);
      if (!world || cancelled) return;

      // Reset tree to just the world node
      const initialMap = new Map<string, NodeState>([[
        worldId,
        { entity: world, childIds: null, isExpanded: false, isLoading: false },
      ]]);
      setNodes(initialMap);
      nodesRef.current = initialMap;

      // Expand world + each ancestor in sequence
      const toExpand = [worldId, ...ancestorIds.filter(id => id !== worldId)];

      for (const aid of toExpand) {
        if (cancelled) return;
        const node = nodesRef.current.get(aid);
        if (!node || node.childIds !== null) continue;

        const childType = getChildType(node.entity.type);
        if (!childType) continue;

        const children = await APIService.getChildren(node.entity.type, aid, childType);
        if (cancelled) return;

        const next = new Map(nodesRef.current);
        for (const c of children) {
          if (!next.has(c.id)) {
            next.set(c.id, { entity: c, childIds: null, isExpanded: false, isLoading: false });
          }
        }
        const parent = next.get(aid);
        if (parent) {
           next.set(aid, { ...parent, childIds: children.map(c => c.id), isExpanded: true, isLoading: false });
        }
        nodesRef.current = next;
        setNodes(next);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [worldId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: When navigating within the same world, just expand any new ancestors
  const ancestorKey = ancestorIds.join(',');
  useEffect(() => {
    const expandNewAncestors = async () => {
      for (const aid of ancestorIds) {
        await expandNodeById(aid, true);
      }
    };
    expandNewAncestors();
  }, [ancestorKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderNode = (id: string, depth: number): React.ReactNode => {
    const node = nodes.get(id);
    if (!node) return null;
    const { entity, childIds, isExpanded, isLoading } = node;
    const isLeaf = entity.type === 'npc';
    const isActive = entity.id === currentEntityId;

    const handleClick = () => {
      if (!isLeaf) expandNodeById(id);
      navigate(`/view/${entity.type}/${entity.id}`);
    };

    const handleChevronClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      expandNodeById(id);
    };

    return (
      <React.Fragment key={id}>
        <NavLink
          label={entity.name}
          active={isActive}
          color="gold"
          leftSection={
            <span style={{ paddingLeft: depth * 10 }}>
              {ENTITY_ICONS[entity.type]}
            </span>
          }
          rightSection={
            isLoading ? (
              <Loader size={12} color="dimmed" />
            ) : !isLeaf ? (
              <ChevronRight
                size={12}
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'none',
                  transition: 'transform 150ms ease',
                  color: 'var(--mantine-color-dimmed)',
                }}
                onClick={handleChevronClick}
              />
            ) : null
          }
          onClick={handleClick}
          styles={{ label: { fontSize: 13 } }}
        />
        {isExpanded && childIds && childIds.map(cid => renderNode(cid, depth + 1))}
      </React.Fragment>
    );
  };

  return <>{renderNode(worldId, 0)}</>;
};
