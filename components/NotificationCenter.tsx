"use client";

import { useEffect, useState } from "react";
import { insforge } from "@/lib/insforge";
import { toast } from "sonner";
import { markNotificationsAsRead } from "@/lib/services/notifications";

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Cargar notificaciones existentes
    const fetchNotifications = async () => {
      const { data } = await insforge.database
        .from("app_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data as AppNotification[]);
      }
    };
    fetchNotifications();

    // 2. Suscribirse a cambios en tiempo real
    const channel = insforge.channel('app_notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'app_notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications(prev => [newNotif, ...prev]);
          toast(newNotif.title, {
            description: newNotif.message,
            action: newNotif.link ? {
              label: 'Ver',
              onClick: () => window.location.href = newNotif.link,
            } : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      insforge.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleOpen = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (nextIsOpen && unreadCount > 0) {
      // Marcar como leídas
      markNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 rounded-full text-on-surface-variant hover:text-primary transition-colors duration-300 group focus:outline-none"
      >
        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white z-10 border-2 border-surface">
              {unreadCount}
            </span>
            <span className="absolute top-1 right-1 flex h-4 w-4 rounded-full bg-[#ef4444] opacity-50 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 glass-dropdown rounded-xl overflow-hidden z-50 bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 relative overflow-hidden">
            <h3 className="font-headline-md text-[18px] font-bold text-primary relative z-10">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="font-label-caps text-[10px] text-[#10b981] px-2 py-1 rounded bg-[#10b981]/10 border border-[#10b981]/20 relative z-10">
                {unreadCount} NUEVAS
              </span>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 font-body-md text-sm">
                No tienes notificaciones
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group relative ${!notif.is_read ? 'bg-white/[0.02]' : 'opacity-70'}`}
                  onClick={() => {
                    if (notif.link) window.location.href = notif.link;
                  }}
                >
                  {!notif.is_read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  )}
                  <div className="flex gap-3 pl-3 items-start">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notif.is_read ? 'bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]' : 'bg-white/10 border border-white/20 text-white'}`}>
                      <span className="material-symbols-outlined text-sm">
                        {notif.type === 'success' ? 'check_circle' : notif.type === 'warning' ? 'bolt' : 'info'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className={`font-body-md text-[14px] leading-tight mb-1 ${!notif.is_read ? 'font-semibold text-white group-hover:text-[#10b981]' : 'text-zinc-300'}`}>
                        {notif.title}
                      </p>
                      <p className="font-body-md text-[12px] text-zinc-400 mb-1 leading-snug">
                        {notif.message}
                      </p>
                      <p className="font-label-caps text-[9px] text-zinc-500">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
