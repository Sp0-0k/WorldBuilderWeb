import React, { useState, useEffect, useRef } from 'react';
import { Paper, Title, Group, Text, Button, TextInput, ScrollArea, Collapse, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { dataService as APIService } from '../../data/dataService';
import { chatWithNPCTurn, summarizeConversation } from '../../data/AIService';
import type { InventoryItem, PartyMember } from '../../data/mockData';

interface NPCChatPanelProps {
  entity: any;
  parentChain: any[];
  onMemoryAdded: (updated: any) => void;
}

type Message = { role: 'user' | 'assistant'; content: string };

export const NPCChatPanel: React.FC<NPCChatPanelProps> = ({
  entity, parentChain, onMemoryAdded,
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [party, setParty] = useState<PartyMember[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const poi = parentChain[parentChain.length - 1];
  const worldId = parentChain[0]?.id;
  useEffect(() => {
    if (poi?.id) APIService.getInventory(poi.id).then(setInventory).catch(() => {});
  }, [poi?.id]);
  useEffect(() => {
    if (worldId) APIService.getParty(worldId).then(setParty).catch(() => {});
  }, [worldId]);

  useEffect(() => {
    if (chatOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsSending(true);
    try {
      const reply = await chatWithNPCTurn(entity, next, parentChain, inventory, party);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      notifications.show({ title: 'Chat error', message: e.message, color: 'deepRed' });
    }
    setIsSending(false);
  };

  const handleEndConversation = async () => {
    if (messages.length === 0) { setChatOpen(false); return; }
    setIsEnding(true);
    try {
      const diary = await summarizeConversation(entity, messages);
      await APIService.addNPCMemory(entity.id, diary);
      const updated = await APIService.getEntityByRoute('npc', entity.id);
      if (updated) onMemoryAdded(updated);
    } catch (e: any) {
      notifications.show({ title: 'Could not save memory', message: e.message, color: 'deepRed' });
    }
    setMessages([]);
    setChatOpen(false);
    setIsEnding(false);
  };

  return (
    <Paper mt="md" p="xl" radius="md">
      <Group justify="space-between">
        <Group>
          <MessageCircle size={20} color="var(--mantine-color-gold-4)" />
          <Title order={4} c="gold.4">Chat with {entity.name}</Title>
        </Group>
        <ActionIcon
          variant="subtle"
          color="brown"
          onClick={() => setChatOpen(o => !o)}
        >
          {chatOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </ActionIcon>
      </Group>

      <Collapse in={chatOpen}>
        <ScrollArea h={400} mt="md" type="auto">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
            {messages.length === 0 && (
              <Text c="dimmed" size="sm" ta="center">Start a conversation with {entity.name}.</Text>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: msg.role === 'user'
                      ? 'var(--mantine-color-brown-8)'
                      : 'var(--mantine-color-darkGray-7)',
                  }}
                >
                  <Text
                    size="sm"
                    c={msg.role === 'user' ? 'white' : 'gold.4'}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {msg.content}
                  </Text>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <Group mt="sm" gap="xs">
          <TextInput
            placeholder="Say something..."
            value={input}
            onChange={e => setInput(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={isSending || isEnding}
            style={{ flex: 1 }}
          />
          <Button
            color="forestGreen"
            onClick={handleSend}
            loading={isSending}
            disabled={isEnding}
            leftSection={<Send size={14} />}
          >
            Send
          </Button>
        </Group>

        <Group mt="xs">
          <Button
            color="deepRed"
            variant="outline"
            size="xs"
            onClick={handleEndConversation}
            loading={isEnding}
            disabled={isSending}
          >
            End Conversation
          </Button>
        </Group>
      </Collapse>
    </Paper>
  );
};
