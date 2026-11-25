/**
 * NotificationBell — 44px square button with unread count. Opens /notifications.
 */
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/pages/notifications/hooks/useNotifications";

export default function NotificationBell() {
  const navigate = useNavigate();
  const { data: unreadData } = useUnreadCount();
  const unread = unreadData?.count ?? 0;

  return (
    <button
      onClick={() => navigate("/admin/notifications")}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) border border-line bg-surface text-ink-2 transition-colors hover:bg-petal hover:text-plum-deep"
      aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
    >
      <Bell size={20} strokeWidth={2} aria-hidden="true" />
      {unread > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-paper bg-plum px-1 text-[0.6875rem] font-bold text-white"
          aria-hidden="true"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
