import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageBanner } from '../../components/common/PageBanner';
import { publicNotificationService } from '../../services';
import {
  Bell,
  Search,
  X,
  ExternalLink,
  Pin,
  Calendar,
  AlertCircle,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

const NOTIFICATION_TYPES = [
  { id: 'ALL', label: 'All Notifications' },
  { id: 'EXAM_ALERT', label: 'Exam Alerts' },
  { id: 'ADMISSION', label: 'Admissions' },
  { id: 'ANNOUNCEMENT', label: 'Announcements' },
  { id: 'RESULT', label: 'Results & Keys' },
  { id: 'GENERAL', label: 'General' },
];

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeType, setActiveType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: 50 };
      if (activeType !== 'ALL') params.type = activeType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await publicNotificationService.getPublicNotifications(params);
      if (res && res.success) {
        const list = res.data?.notifications || res.data || [];
        setNotifications(list);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load institutional notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotifications();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setTimeout(fetchNotifications, 50);
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'EXAM_ALERT':
        return { label: 'Exam Alert', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'ADMISSION':
        return { label: 'Admission', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'RESULT':
        return { label: 'Result / Answer Key', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'ANNOUNCEMENT':
        return { label: 'Announcement', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: 'General Notice', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageBanner
        title="Institutional Notifications & Alerts"
        subtitle="Official circulars, examination alerts, registration schedules, and important announcements."
        breadcrumbs={[{ label: 'Notifications' }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Search & Filter Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by keyword, examination, or topic..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#1769D2] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-20 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 bg-[#0B2545] hover:bg-[#12356B] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {NOTIFICATION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveType(t.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeType === t.id
                    ? 'bg-[#1769D2] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Stream */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-5 bg-slate-200 rounded-md" />
                  <div className="w-24 h-4 bg-slate-200 rounded-md" />
                </div>
                <div className="w-3/4 h-5 bg-slate-200 rounded-md" />
                <div className="w-full h-4 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchNotifications}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3 shadow-xs">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no active notifications matching your selected filter or search keyword.
            </p>
            {(activeType !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setActiveType('ALL');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1769D2] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const badge = getTypeBadge(item.type);
              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all hover:shadow-md ${
                    item.isPinned
                      ? 'border-amber-300/80 bg-amber-50/15 ring-1 ring-amber-200/50'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Meta Header */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300/80 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <Pin className="w-3 h-3 fill-amber-700 text-amber-700" /> Important
                          </span>
                        )}
                        <span className={`border font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.publishedAt || item.createdAt)}
                        </span>
                        {item.expiresAt && (
                          <span className="text-amber-600 text-[11px] flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> Valid until: {formatDate(item.expiresAt)}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setSelectedNotification(item)}
                        className="text-base sm:text-lg font-black text-[#0B2545] font-serif hover:text-[#1769D2] cursor-pointer transition-colors leading-snug"
                      >
                        {item.title}
                      </h3>

                      {/* Snippet */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {item.description || item.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => setSelectedNotification(item)}
                        className="text-xs font-bold text-[#1769D2] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Read Details
                      </button>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-slate-600 hover:text-[#0B2545] inline-flex items-center gap-1 px-2.5 py-1.5"
                        >
                          <span>Visit Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {item.attachment && (
                        <a
                          href={item.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF / Doc</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedNotification.isPinned && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <Pin className="w-3 h-3 fill-amber-700 text-amber-700" /> Pinned
                  </span>
                )}
                <span className={`border font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getTypeBadge(selectedNotification.type).bg}`}>
                  {getTypeBadge(selectedNotification.type).label}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(selectedNotification.publishedAt || selectedNotification.createdAt)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] font-serif leading-tight">
                {selectedNotification.title}
              </h2>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
              {selectedNotification.description || selectedNotification.message}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedNotification.link && (
                  <a
                    href={selectedNotification.link}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#0B2545] hover:bg-[#12356B] text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Official Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {selectedNotification.attachment && (
                  <a
                    href={selectedNotification.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Attachment</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
