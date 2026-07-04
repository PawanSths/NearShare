import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; displayName: string };
}

export function ChatPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId || !token || !userId) return;

    const socketUrl = import.meta.env.VITE_API_URL || '';
    const socket = io(socketUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:event', eventId);
    });

    socket.on('messages:init', (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });

    socket.on('message:new', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user:joined', (data: { userId: string; displayName: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `join-${Date.now()}`,
          content: `${data.displayName} joined`,
          createdAt: new Date().toISOString(),
          user: { id: data.userId, displayName: 'System' },
        },
      ]);
    });

    socket.on('user:left', (data: { userId: string; displayName: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `leave-${Date.now()}`,
          content: `${data.displayName} left`,
          createdAt: new Date().toISOString(),
          user: { id: data.userId, displayName: 'System' },
        },
      ]);
    });

    socket.on('error', (msg: string) => {
      setError(msg);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      if (eventId) socket.emit('leave:event', eventId);
      socket.close();
      socketRef.current = null;
    };
  }, [eventId, token, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const content = input.trim();
    if (!content || !eventId || !socketRef.current) return;
    socketRef.current.emit('message:send', { eventId, content });
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!eventId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Invalid event.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>

      <Card sx={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
        <CardContent sx={{ flex: 1, overflowY: 'auto', pb: 1 }}>
          {!connected ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }}>Connecting to chat...</Typography>
            </Box>
          ) : messages.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No messages yet. Start the conversation!
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.map((msg) => {
                const isSystem = msg.user.displayName === 'System';
                const isOwn = msg.user.id === userId;
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      alignSelf: isSystem ? 'center' : isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                      bgcolor: isSystem
                        ? 'action.hover'
                        : isOwn
                          ? 'primary.main'
                          : 'grey.100',
                      color: isOwn && !isSystem ? 'white' : 'text.primary',
                      borderRadius: 2,
                      px: 1.5,
                      py: 0.75,
                    }}
                  >
                    {!isSystem ? (
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                        {msg.user.displayName}
                      </Typography>
                    ) : null}
                    <Typography variant="body2">{msg.content}</Typography>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>
          )}
          {error ? (
            <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          ) : null}
        </CardContent>

        <Box sx={{ display: 'flex', gap: 1, p: 2, borderTop: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!connected}
          />
          <Button variant="contained" onClick={handleSend} disabled={!connected || !input.trim()}>
            Send
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
