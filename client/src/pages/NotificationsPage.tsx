import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Send,
  RefreshCcw,
  Sparkles,
  Search,
  CheckCheck,
  User,
  Users,
  AlertOctagon,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import {
  getMyNotifications,
  markAllMyNotificationsAsRead,
  markNotificationAsRead,
  createNotification,
  createBulkNotification,
} from "../api/notifications";
import { getUsers } from "../api/users";
import type { Notification, NotificationPriority, NotificationType } from "../types/notification";
import type { UserProfile } from "../types/frontend";

export default function NotificationsPage() {
  const { bootstrap } = useAuth();
  
  // Roles
  const isManager =
    bootstrap?.role === "SUPER_ADMIN" ||
    bootstrap?.role === "TRANSPORT_ADMIN" ||
    bootstrap?.role === "ACCOMMODATION_ADMIN" ||
    bootstrap?.role === "FINANCE_OFFICER" ||
    bootstrap?.role === "MANAGER";

  // Data States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  // Navigation / Tabs
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Broadcast Form State
  const [isBulkSend, setIsBulkSend] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<NotificationType>("SYSTEM");
  const [broadcastPriority, setBroadcastPriority] = useState<NotificationPriority>("NORMAL");

  // UI state
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load feeds
  async function loadData() {
    try {
      setIsLoading(true);
      setError("");
      const alerts = await getMyNotifications();
      setNotifications(alerts || []);

      if (isManager) {
        const userList = await getUsers();
        setUsers(userList || []);
      }
    } catch (err) {
      setError("Failed to sync your notification logs");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter calculations
  const filteredAlerts = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();
    return notifications.filter((alert) => {
      const matchesSearch =
        !keyword ||
        alert.title.toLowerCase().includes(keyword) ||
        alert.message.toLowerCase().includes(keyword) ||
        alert.type.toLowerCase().includes(keyword);

      const matchesStatus =
        filterType === "ALL" ||
        (filterType === "UNREAD" && alert.status === "UNREAD") ||
        (filterType === "READ" && alert.status === "READ");

      return matchesSearch && matchesStatus;
    });
  }, [notifications, searchQuery, filterType]);

  const summary = useMemo(() => {
    const unread = notifications.filter((n) => n.status === "UNREAD");
    return {
      total: notifications.length,
      unread: unread.length,
      urgent: unread.filter((n) => n.priority === "URGENT").length,
    };
  }, [notifications]);

  // Mark single as read
  async function handleMarkAsRead(id: string) {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" as const } : n))
      );
      // Optional: Refresh context badge summary count
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  }

  // Mark all as read
  async function handleMarkAllRead() {
    setError("");
    setMessage("");
    try {
      await markAllMyNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" as const })));
      setMessage("All notifications marked as read");
    } catch (err) {
      setError("Failed to mark all as read");
    }
  }

  // Handle send notification
  async function handleBroadcastSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
        throw new Error("Title and message are required");
      }

      if (isBulkSend) {
        if (selectedRecipientIds.length === 0) {
          throw new Error("Please select at least one recipient");
        }
        await createBulkNotification({
          recipientIds: selectedRecipientIds,
          type: broadcastType,
          priority: broadcastPriority,
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
        });
        setMessage("Broadcast notification sent successfully");
      } else {
        if (!selectedRecipientId) {
          throw new Error("Please select a recipient");
        }
        await createNotification({
          recipientId: selectedRecipientId,
          type: broadcastType,
          priority: broadcastPriority,
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
        });
        setMessage("Direct alert sent successfully");
      }

      // Reset form
      setBroadcastTitle("");
      setBroadcastMessage("");
      setSelectedRecipientId("");
      setSelectedRecipientIds([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to broadcast notification");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Multi select toggle helper
  function toggleRecipient(id: string) {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  // Get icons according to type
  function getAlertIcon(type: NotificationType) {
    switch (type) {
      case "SOS":
        return <AlertOctagon className="text-red-600" size={18} />;
      case "TELEMETRY":
        return <RefreshCcw className="text-blue-500" size={18} />;
      case "TRAVEL_REQUEST":
        return <Calendar className="text-indigo-500" size={18} />;
      case "ACCOMMODATION":
        return <Megaphone className="text-violet-500" size={18} />;
      case "EXPENSE":
        return <Sparkles className="text-emerald-500" size={18} />;
      case "SHUTTLE":
        return <Megaphone className="text-amber-500" size={18} />;
      default:
        return <Info className="text-slate-500" size={18} />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Inbox Alert Center
          </h1>
          <p className="text-sm text-slate-500">
            Read corporate travel warnings, shuttle dispatch assignments, and log broadcast announcements.
          </p>
        </div>
        <div className="flex gap-2">
          {summary.unread > 0 && (
            <Button
              variant="secondary"
              onClick={handleMarkAllRead}
              className="rounded-xl border border-slate-200 text-xs py-2"
            >
              <CheckCheck size={15} className="mr-1.5" />
              Mark All as Read
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={loadData}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 text-xs py-2"
          >
            <RefreshCcw size={15} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Message alerts */}
      {message && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-100">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 border border-red-100">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Grid columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Alerts Inbox */}
        <div className={`lg:col-span-2 space-y-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterType === "ALL"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                All ({summary.total})
              </button>
              <button
                onClick={() => setFilterType("UNREAD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  filterType === "UNREAD"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Unread
                {summary.unread > 0 && (
                  <span className="rounded-full bg-blue-700 text-white font-mono text-[9px] w-4 h-4 flex items-center justify-center">
                    {summary.unread}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterType("READ")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterType === "READ"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Read
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search alerts inbox..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div className="space-y-3.5">
            {isLoading ? (
              <div className="text-center py-20 text-slate-400 italic">
                Syncing inbox...
              </div>
            ) : filteredAlerts.map((alert) => {
              const isUnread = alert.status === "UNREAD";
              
              const priorityColors = {
                LOW: "border-slate-200 bg-slate-50 text-slate-600",
                NORMAL: "border-slate-100 bg-white text-slate-800",
                HIGH: "border-amber-200 bg-amber-50/20 text-slate-800",
                URGENT: "border-red-200 bg-red-50/20 text-slate-900 pulse border-dashed",
              };

              return (
                <div
                  key={alert.id}
                  onClick={() => isUnread && handleMarkAsRead(alert.id)}
                  className={`rounded-2xl border p-4 transition duration-200 ${
                    isUnread ? "shadow-xs border-l-4 border-l-blue-600" : ""
                  } ${priorityColors[alert.priority]} ${
                    isUnread ? "cursor-pointer hover:bg-slate-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-slate-100/60 p-2 mt-0.5 shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">{alert.title}</h4>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              alert.priority === "URGENT"
                                ? "bg-red-100 text-red-800 animate-pulse"
                                : alert.priority === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {alert.priority}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10px] text-slate-400 font-semibold uppercase">
                    <span>Category: {alert.type.replace(/_/g, " ")}</span>
                    {alert.createdBy && (
                      <span>Issued by: {alert.createdBy.fullName}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAlerts.length === 0 && (
              <div className="rounded-2xl bg-white p-12 text-center border border-slate-100 shadow-xs">
                <Bell className="mx-auto text-slate-300" size={36} />
                <h3 className="mt-4 font-bold text-slate-800 text-sm sm:text-base">Your alert inbox is empty</h3>
                <p className="text-slate-400 text-xs mt-1">There are no matching notifications logged for your account.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Broadcast Announcement Console (Only for Managers/Admins) */}
        {isManager && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
                <Megaphone size={16} className="text-blue-700" /> Dispatch Broadcast Panel
              </h3>

              <form onSubmit={handleBroadcastSubmit} className="mt-4 space-y-4">
                <div className="flex gap-4 border-b border-slate-100 pb-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsBulkSend(false)}
                    className={`flex items-center gap-1 pb-1 transition border-b-2 ${
                      !isBulkSend ? "border-blue-700 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <User size={13} /> Direct Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkSend(true)}
                    className={`flex items-center gap-1 pb-1 transition border-b-2 ${
                      isBulkSend ? "border-blue-700 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Users size={13} /> Bulk Broadcast
                  </button>
                </div>

                {!isBulkSend ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Recipient Employee *
                    </label>
                    <select
                      required
                      value={selectedRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
                    >
                      <option value="">Choose user profile...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role?.name.replace(/_/g, " ")})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      Select Broadcast Targets *
                    </label>
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-2">
                      {users.map((u) => {
                        const isChecked = selectedRecipientIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleRecipient(u.id)}
                            className="flex items-center gap-2 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded text-blue-600"
                            />
                            <span className="text-[11px] font-medium text-slate-700">
                              {u.fullName} ({u.role?.name.replace(/_/g, " ")})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Priority
                    </label>
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as NotificationPriority)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Red Alert)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Type
                    </label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as NotificationType)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
                    >
                      <option value="SYSTEM">System Announcement</option>
                      <option value="SHUTTLE">Shuttle Operations</option>
                      <option value="TRAVEL_REQUEST">Travel Request</option>
                      <option value="ACCOMMODATION">Accommodation</option>
                      <option value="EXPENSE">Expense Claim</option>
                      <option value="TELEMETRY">Telemetry Alert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
                    placeholder="e.g. Schedule Delay Alert"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Alert Message Content *
                  </label>
                  <textarea
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-600 transition"
                    placeholder="Describe announcement instructions..."
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <Button type="submit" disabled={isSubmitting} className="rounded-xl w-full">
                    <Send size={14} className="mr-2" />
                    {isSubmitting ? "Dispatching Alert..." : isBulkSend ? "Broadcast Alert" : "Send Alert"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
