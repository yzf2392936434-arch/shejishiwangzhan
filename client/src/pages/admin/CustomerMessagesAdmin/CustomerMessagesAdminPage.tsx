import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, User, Search, Inbox, MessageSquare } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { customerMessagesApi } from '@client/src/api';
import type { CustomerSession } from '@shared/api.interface';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const CustomerMessagesAdminPage: React.FC = () => {
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await customerMessagesApi.getAdminSessions();
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
      setSessions(sorted);
    } catch (e) {
      logger.error('load sessions failed', e);
      toast.error('加载会话列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) ??
      !searchQuery;
    const matchesFilter =
      filter === 'all' ? true : s.unreadCount > 0;
    return matchesSearch && matchesFilter;
  });

  const selected = sessions.find((s) => s.sessionId === selectedId) || null;

  useEffect(() => {
    if (selected && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected?.messages.length]);

  const handleSelect = async (sessionId: string) => {
    setSelectedId(sessionId);
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (session && session.unreadCount > 0) {
      try {
        await customerMessagesApi.markSessionRead(sessionId);
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === sessionId ? { ...s, unreadCount: 0 } : s,
          ),
        );
      } catch (e) {
        logger.error('mark read failed', e);
      }
    }
  };

  const handleReply = async () => {
    const trimmed = reply.trim();
    if (!trimmed || !selectedId || sending) return;

    setSending(true);
    try {
      const msg = await customerMessagesApi.replySessionMessage(selectedId, trimmed);
      setSessions((prev) =>
        prev.map((s) => {
          if (s.sessionId !== selectedId) return s;
          return {
            ...s,
            messages: [...s.messages, msg],
            lastMessageAt: msg.createdAt,
          };
        }),
      );
      setReply('');
    } catch (e) {
      logger.error('reply failed', e);
      toast.error('回复失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleReply();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      <div className="w-72 flex flex-col bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-[#ececec] space-y-3">
          <h2 className="text-base font-semibold text-[#1b1b1b]">会话列表</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8a8a8a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索访客..."
              className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-[#e5e5e5] bg-white focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150"
            />
          </div>
          <div className="flex gap-1 p-1 bg-[#f3f3f3] rounded-md">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-7 text-xs font-medium rounded-md transition-all duration-150 ${
                filter === 'all'
                  ? 'bg-white text-[#1b1b1b] shadow-sm'
                  : 'text-[#5c5c5c] hover:text-[#1b1b1b]'
              }`}
            >
              <Inbox className="size-3.5" />
              全部
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-7 text-xs font-medium rounded-md transition-all duration-150 ${
                filter === 'unread'
                  ? 'bg-white text-[#1b1b1b] shadow-sm'
                  : 'text-[#5c5c5c] hover:text-[#1b1b1b]'
              }`}
            >
              <MessageSquare className="size-3.5" />
              未读
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredSessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="size-10 text-[#c0c0c0] mb-3" />
              <p className="text-sm font-semibold text-[#1b1b1b]">暂无会话</p>
              <p className="text-xs text-[#8a8a8a] mt-1">
                {filter === 'unread' ? '没有未读消息' : '还没有访客咨询'}
              </p>
            </div>
          )}
          {filteredSessions.map((session) => {
            const lastMsg = session.messages[session.messages.length - 1];
            const isActive = session.sessionId === selectedId;
            return (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => void handleSelect(session.sessionId)}
                className={`w-full p-3 text-left rounded-md transition-all duration-150 mb-1 ${
                  isActive
                    ? 'bg-[#deecf9] border-l-2 border-[#0067c0]'
                    : 'hover:bg-[#f5f5f5]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex size-9 items-center justify-center rounded-full bg-[#f5f5f5] flex-shrink-0">
                      <User size={16} className="text-[#5c5c5c]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-sm truncate block ${
                          session.unreadCount > 0
                            ? 'font-semibold text-[#1b1b1b]'
                            : 'font-medium text-[#1b1b1b]'
                        }`}
                      >
                        {session.visitorName || '匿名访客'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] text-[#8a8a8a]">
                      {formatTime(session.lastMessageAt)}
                    </span>
                    {session.unreadCount > 0 && (
                      <span className="flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#0067c0] text-white text-[10px] font-medium px-1.5">
                        {session.unreadCount > 99 ? '99+' : session.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#5c5c5c] truncate pl-11">
                  {lastMsg?.content || ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0_0_0_0.04),_0_1px_2px_rgba(0_0_0_0.02)] overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#5c5c5c]">
            <MessageSquare className="size-10 text-[#c0c0c0] mb-3" />
            <p className="text-sm font-semibold text-[#1b1b1b]">选择一个会话</p>
            <p className="text-xs text-[#8a8a8a] mt-1">从左侧列表选择会话开始回复</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3.5 border-b border-[#ececec] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#f5f5f5]">
                  <User size={16} className="text-[#5c5c5c]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1b1b1b]">
                    {selected.visitorName || '匿名访客'}
                  </p>
                  <p className="text-xs text-[#5c5c5c]">
                    会话ID：{selected.sessionId.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#dff6dd] text-[#107c10] border border-[#b6e0b2] text-xs font-medium">
                <span className="size-1.5 rounded-full bg-[#107c10]" />
                在线
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#f9f9f9]">
              {selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isAdminReply ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 text-sm leading-relaxed break-words ${
                      msg.isAdminReply
                        ? 'bg-[#0067c0] text-white rounded-xl rounded-tr-sm'
                        : 'bg-[#f5f5f5] text-[#1b1b1b] rounded-xl rounded-tl-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-[11px] mt-1.5 text-right ${
                        msg.isAdminReply ? 'text-white/60' : 'text-[#8a8a8a]'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#ececec] p-4 bg-white">
              <div className="relative">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入回复内容，按 Enter 发送..."
                  rows={1}
                  className="w-full px-4 py-2.5 pr-14 text-sm border border-[#e5e5e5] rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-[#0067c0]/30 focus:border-[#0067c0] transition-all duration-150 min-h-[44px] max-h-32"
                />
                <button
                  type="button"
                  onClick={() => void handleReply()}
                  disabled={!reply.trim() || sending}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-[#0067c0] text-white hover:bg-[#1076d0] active:bg-[#005aa8] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.96]"
                  aria-label="发送回复"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerMessagesAdminPage;
