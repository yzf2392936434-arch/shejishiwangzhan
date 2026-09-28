import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { customerMessagesApi } from '@client/src/api';
import type { CustomerMessage, SiteSettings } from '@shared/api.interface';

const STORAGE_KEY_SESSION = 'cs_session_id';
const STORAGE_KEY_NAME = 'cs_visitor_name';
const STORAGE_KEY_AUTO_SHOWN = 'cs_auto_shown';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

interface CustomerServiceWidgetProps {
  settings: SiteSettings | null;
}

const CustomerServiceWidget: React.FC<CustomerServiceWidgetProps> = ({ settings }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [input, setInput] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPopupFiredRef = useRef(false);

  useEffect(() => {
    let sid = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem(STORAGE_KEY_SESSION, sid);
    }
    setSessionId(sid);
    const savedName = localStorage.getItem(STORAGE_KEY_NAME) || '';
    setVisitorName(savedName);
  }, []);

  const loadMessages = async () => {
    if (!sessionId) return;
    try {
      const msgs = await customerMessagesApi.getVisitorMessages(sessionId);
      setMessages(msgs);
    } catch (e) {
      logger.error('load messages failed', e);
    }
  };

  useEffect(() => {
    if (open && sessionId) {
      void loadMessages();
      pollTimerRef.current = setInterval(() => {
        void loadMessages();
      }, 5000);
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!settings?.autoPopupCsEnabled) return;
    if (!settings?.customerServiceEnabled) return;
    if (autoPopupFiredRef.current) return;
    if (sessionStorage.getItem(STORAGE_KEY_AUTO_SHOWN)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      autoPopupFiredRef.current = true;
      sessionStorage.setItem(STORAGE_KEY_AUTO_SHOWN, '1');
    }, 1000);
    return () => clearTimeout(timer);
  }, [settings]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !sessionId || loading) return;
    const name = visitorName.trim() || undefined;
    if (visitorName.trim()) {
      localStorage.setItem(STORAGE_KEY_NAME, visitorName.trim());
    }
    const optimistic: CustomerMessage = {
      id: `opt_${Date.now()}`,
      sessionId,
      visitorName: name,
      content: trimmed,
      isAdminReply: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setLoading(true);
    try {
      const msg = await customerMessagesApi.sendVisitorMessage(sessionId, trimmed, name);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? msg : m)),
      );
    } catch (e) {
      logger.error('send message failed', e);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!settings?.customerServiceEnabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90 transition-opacity"
          aria-label="打开客服"
        >
          <MessageCircle size={24} />
        </button>
      ) : (
        <div className="flex flex-col w-[90vw] max-w-[360px] h-[70vh] max-h-[480px] rounded-lg border border-border bg-card text-card-foreground shadow-xl md:w-[360px] md:h-[480px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground">在线咨询</h3>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  sessionStorage.setItem(STORAGE_KEY_AUTO_SHOWN, '1');
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                暂无消息，开始咨询吧
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isAdminReply ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm leading-relaxed break-words ${
                    msg.isAdminReply
                      ? 'bg-muted text-foreground rounded-bl-none'
                      : 'bg-foreground text-background rounded-br-none'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.isAdminReply ? 'text-muted-foreground' : 'text-white/60'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border p-3 space-y-2">
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="您的称呼（可选）"
              className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入消息..."
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading}
                className="flex size-10 items-center justify-center rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity self-end"
                aria-label="发送"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerServiceWidget;
