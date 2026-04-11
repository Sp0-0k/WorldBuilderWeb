import React, { useState, useEffect, useRef } from 'react';
import { Paper, Title, Group, Text, Button, TextInput, ScrollArea, Collapse, ActionIcon, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MessageCircle, ChevronDown, ChevronUp, Send, Mic, MicOff } from 'lucide-react';
import { dataService as APIService } from '../../data/dataService';
import { chatWithNPCTurn, summarizeConversation, transcribeAudio } from '../../data/AIService';
import type { AnyEntity, InventoryItem, NPC, PartyMember } from '../../data/mockData';

interface NPCChatPanelProps {
  entity: NPC;
  parentChain: AnyEntity[];
  onMemoryAdded: (updated: NPC) => void;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  /** AI-safe speaker label: race + class only, no character name. Injected into the prompt. */
  speaker?: string;
  /** Display label shown in the chat UI: includes the character name when set. */
  speakerDisplay?: string;
};

// Converts display messages to AI-ready history, injecting speaker context into user turns.
function buildAIHistory(messages: Message[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.speaker ? `[${msg.speaker} speaks] ${msg.content}` : msg.content,
  }));
}

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
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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


  const getSpeaker = (memberId: string | null): { ai: string; display: string } | undefined => {
    if (!memberId) return undefined;
    const m = party.find(p => p.id === memberId);
    if (!m) return undefined;
    const ai = `${m.race} ${m.className}`;
    const display = m.name ? `${m.name} (${m.race} ${m.className})` : ai;
    return { ai, display };
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const speakerInfo = getSpeaker(selectedSpeakerId);
    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      speaker: speakerInfo?.ai,
      speakerDisplay: speakerInfo?.display,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsSending(true);
    try {
      const reply = await chatWithNPCTurn(entity, buildAIHistory(next), parentChain, inventory, party);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: unknown) {
      notifications.show({ title: 'Chat error', message: e instanceof Error ? e.message : String(e), color: 'deepRed' });
    }
    setIsSending(false);
  };

  const handleEndConversation = async () => {
    if (messages.length === 0) { setChatOpen(false); return; }
    setIsEnding(true);
    try {
      const diary = await summarizeConversation(entity, buildAIHistory(messages));
      await APIService.addNPCMemory(entity.id, diary);
      const updated = await APIService.getEntityByRoute('npc', entity.id);
      if (updated) onMemoryAdded(updated as NPC);
    } catch (e: unknown) {
      notifications.show({ title: 'Could not save memory', message: e instanceof Error ? e.message : String(e), color: 'deepRed' });
    }
    setMessages([]);
    setChatOpen(false);
    setIsEnding(false);
  };

  const toggleListening = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const transcript = await transcribeAudio(audioBlob);
          setInput(transcript);
        } catch (e: unknown) {
          notifications.show({ title: 'Transcription failed', message: e instanceof Error ? e.message : String(e), color: 'deepRed' });
        }
        setIsTranscribing(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (e: unknown) {
      notifications.show({ title: 'Microphone error', message: e instanceof Error ? e.message : String(e), color: 'deepRed' });
    }
  };

  const speakerOptions = party.map(m => ({
    value: m.id,
    label: m.name ? `${m.name} (${m.race} ${m.className})` : `${m.race} ${m.className}`,
  }));

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
          onClick={() => {
            if (chatOpen) {
              mediaRecorderRef.current?.stop();
              setIsListening(false);
            }
            setChatOpen(o => !o);
          }}
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
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'user' && (msg.speakerDisplay ?? msg.speaker) && (
                  <Text size="xs" c="dimmed" mb={2}>{msg.speakerDisplay ?? msg.speaker}</Text>
                )}
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

        {speakerOptions.length > 0 && (
          <Select
            mt="sm"
            placeholder="Speaking as..."
            data={speakerOptions}
            value={selectedSpeakerId}
            onChange={setSelectedSpeakerId}
            clearable
            size="xs"
          />
        )}

        <Group mt="sm" gap="xs">
          <ActionIcon
            variant={isListening ? 'filled' : 'subtle'}
            color={isListening ? 'deepRed' : 'brown'}
            size="lg"
            onClick={toggleListening}
            disabled={isSending || isEnding || isTranscribing}
            title={isListening ? 'Stop recording' : 'Speak'}
            loading={isTranscribing}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </ActionIcon>
          <TextInput
            placeholder={isListening ? 'Recording...' : isTranscribing ? 'Transcribing...' : 'Say something...'}
            value={input}
            onChange={e => setInput(e.currentTarget.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={isSending || isEnding || isTranscribing}
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
