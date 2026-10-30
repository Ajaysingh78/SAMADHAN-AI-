import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, ArrowRightLeft, ShieldAlert, Sparkles, CheckCheck } from 'lucide-react';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('samadhanX_token');
      if (!token) return;

      const res = await fetch('/api/v1/workflow/notifications?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data.items || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch(`/api/v1/workflow/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch('/api/v1/workflow/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleNavigate = (notif) => {
    setIsOpen(false);
    if (!notif.read_status) {
      handleMarkAsRead(notif.id, { stopPropagation: () => { } });
    }
    if (notif.navigation_url) {
      navigate(notif.navigation_url);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'CASE_TRANSFERRED':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />;
      case 'CASE_ESCALATED':
      case 'CASE_OVERDUE':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case 'DUE_DATE_REMINDER':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'MATCH_REVIEW_TASK':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
      case 'CLOSURE_APPROVAL_REQUEST':
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNavigate(n)}
                  className={`p-3 text-xs cursor-pointer transition-colors flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${!n.read_status ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                >
                  <div className="mt-0.5 p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {getEventIcon(n.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold truncate ${!n.read_status ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {n.title}
                      </span>
                      {!n.read_status && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          title="Mark as read"
                          className="text-slate-400 hover:text-emerald-600 p-0.5 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 text-[11px] leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/app/workflow');
              }}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 py-1"
            >
              Open Workflow & Reminders Center →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
