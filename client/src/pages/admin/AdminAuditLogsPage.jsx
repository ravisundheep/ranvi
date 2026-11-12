import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  User,
  RefreshCw,
  Trash2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const { isAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Metadata from backend API
  const [meta, setMeta] = useState({
    date: new Date().toISOString().split('T')[0],
    timezone: 'Asia/Kolkata',
    startOfDay: null,
    purgedCount: 0,
    total: 0,
  });

  // Scope, category, search & action filter
  const [scope, setScope] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const fetchLogs = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMessage(null);

        const res = await adminService.getAuditLogs({
          scope,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          limit: 100,
        });
        if (res?.success && res.data) {
          setLogs(res.data.logs || []);
          setMeta({
            date: res.data.date || new Date().toISOString().split('T')[0],
            timezone: res.data.timezone || 'Asia/Kolkata',
            startOfDay: res.data.startOfDay || null,
            purgedCount: res.data.purgedCount || 0,
            total: res.data.pagination?.total ?? (res.data.logs?.length || 0),
          });

          if (isManualRefresh) {
            success("Today's security audit logs refreshed.");
          }
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        setErrorMessage(err.message || 'Unable to load security audit logs');
        if (isManualRefresh) {
          toastError(err.message || 'Failed to refresh audit logs');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [success, toastError, scope, selectedCategory]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Manual purge trigger
  const handleTriggerCleanup = async () => {
    try {
      setCleaning(true);
      const res = await adminService.cleanupAuditLogs();
      if (res?.success) {
        const deleted = res.data?.deletedCount ?? 0;
        success(
          deleted > 0
            ? `Database cleanup complete: Purged ${deleted} expired log(s) older than today.`
            : 'Database verified: No expired logs older than today were found.'
        );
        // Refetch logs after cleanup
        await fetchLogs(false);
      }
    } catch (err) {
      toastError(err.message || 'Failed to execute database cleanup');
    } finally {
      setCleaning(false);
    }
  };

  // Filter logs based on search query and action
  const filteredLogs = logs.filter((log) => {
    const matchesAction =
      selectedAction === 'ALL' || log.action === selectedAction;

    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesAction;

    const matchesSearch =
      (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.resource && log.resource.toLowerCase().includes(term)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(term)) ||
      (log.resourceId && String(log.resourceId).toLowerCase().includes(term));

    return matchesAction && matchesSearch;
  });

  // Action badge color styling helper
  const getActionBadgeStyle = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN_SUCCESS')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('REVOKED') || act.includes('SUSPENDED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('RESET') || act.includes('ACTIVATED')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (act.includes('GRANT') || act.includes('PAYMENT')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-[#12356B] border-blue-200';
  };

  // Format today's date nicely
  const formattedToday = new Date().toLocaleDateString('en-US', {
    timeZone: meta.timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* ========================================================
          1. HEADER WITH CURRENT-DAY AUDIT TRAIL BADGE & ACTIONS
      ======================================================== */}
      <div className="shrink-0 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {scope === 'all' ? 'Immutable Financial & RBAC History' : 'Current-Day View'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <Globe className="w-3 h-3 text-[#1769D2]" />
              Timezone: {meta.timezone}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-[#12356B] font-heading">
            Security & Financial Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Financial transactions, staff RBAC mutations, device resets, and suspension records are immutable and preserved permanently.
            Ephemeral non-immutable logs prior to start-of-day are automatically pruned.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 shadow-xs transition-all disabled:opacity-50"
            title="Refresh logs from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#1769D2]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleTriggerCleanup}
              disabled={cleaning || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 active:scale-95 text-xs font-bold text-rose-700 shadow-xs transition-all disabled:opacity-50"
              title="Prune expired ephemeral audit logs while preserving immutable financial & security trails"
            >
              <Trash2 className={`w-3.5 h-3.5 ${cleaning ? 'animate-spin' : ''}`} />
              <span>{cleaning ? 'Cleaning DB...' : 'Prune Ephemeral Logs'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          2. METRIC STRIP (DATE, TIMEZONE, TOTAL TODAY, STATUS)
      ======================================================== */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today's Date */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769D2] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Active Audit Date
            </span>
            <span className="text-xs font-black text-[#12356B] truncate block">
              {formattedToday}
            </span>
          </div>
        </div>

        {/* Card 2: Today's Events Count */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Today's Security Events
            </span>
            <span className="text-base font-black text-[#12356B]">
              {logs.length} Logged Today
            </span>
          </div>
        </div>

        {/* Card 3: Timezone Cutoff */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Cutoff Timezone
            </span>
            <span className="text-xs font-black text-slate-800 truncate block">
              {meta.timezone} (00:00:00 Cutoff)
            </span>
          </div>
        </div>

        {/* Card 4: Retention Policy Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Auto-Prune Status
            </span>
            <span className="text-xs font-black text-emerald-700">
              Active • Hourly Cleanup Job
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. SEARCH & ACTION FILTER BAR
      ======================================================== */}
      <div className="shrink-0 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search email, IP, action, resource..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30"
          />
        </div>

        {/* Scope, Category & Action Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">Full Immutable History</option>
            <option value="today">Today Only</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="FINANCIAL">Financial & Approvals</option>
            <option value="STAFF_RBAC">Staff & RBAC Security</option>
            <option value="AUTH">Auth & Logins</option>
            <option value="SYSTEM">System</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Event Actions</option>
            {Array.from(new Set(logs.map((l) => l.action).filter(Boolean))).map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1 space-y-6">
        {/* ========================================================
            4. ERROR ALERT BANNER
        ======================================================== */}
        {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchLogs(false)}
            className="underline hover:text-rose-950 ml-4 font-black"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================================
          5. AUDIT LOGS TABLE OR EMPTY STATE
      ======================================================== */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-8 h-8 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">
            Retrieving today's security audit trail...
          </p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200 font-heading">
                  <th className="p-3.5 sm:p-4 font-extrabold whitespace-nowrap">Time</th>
                  <th className="p-3.5 sm:p-4 font-extrabold whitespace-nowrap">Action Type</th>
                  <th className="p-3.5 sm:p-4 font-extrabold whitespace-nowrap">User / Initiator</th>
                  <th className="p-3.5 sm:p-4 font-extrabold whitespace-nowrap">Resource</th>
                  <th className="p-3.5 sm:p-4 font-extrabold whitespace-nowrap">IP & Client</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => {
                  const logDate = new Date(log.createdAt);
                  const formattedTime = logDate.toLocaleTimeString('en-US', {
                    timeZone: meta.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  });

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Time */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          {formattedTime}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {logDate.toLocaleDateString('en-US', { timeZone: meta.timezone })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-md uppercase border tracking-tight ${getActionBadgeStyle(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* User / Initiator */}
                      <td className="p-3.5 sm:p-4">
                        <div className="font-bold text-[#12356B] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={log.userEmail}>
                            {log.userEmail || 'System / Automated'}
                          </span>
                        </div>
                        {log.userRole && (
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                            Role: {log.userRole}
                          </span>
                        )}
                      </td>

                      {/* Resource */}
                      <td className="p-3.5 sm:p-4">
                        <div className="font-semibold text-slate-800">
                          {log.resource}
                        </div>
                        {log.resourceId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]" title={log.resourceId}>
                            ID: {log.resourceId}
                          </div>
                        )}
                        {log.details && (
                          <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate" title={JSON.stringify(log.details)}>
                            {log.details.reason || log.details.studentEmail || (typeof log.details === 'string' ? log.details : JSON.stringify(log.details))}
                          </div>
                        )}
                      </td>

                      {/* IP & Client */}
                      <td className="p-3.5 sm:p-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-700">
                          {log.ipAddress || '127.0.0.1'}
                        </div>
                        {log.userAgent && (
                          <div className="text-[10px] text-slate-400 max-w-[140px] truncate" title={log.userAgent}>
                            {log.userAgent}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Count */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>
              Showing {filteredLogs.length} of {logs.length} security event(s) recorded today
            </span>
            <span className="text-[11px] text-slate-400">
              Retention: Current Day Only ({meta.timezone})
            </span>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#12356B]">
            {searchTerm || selectedAction !== 'ALL'
              ? 'No Matching Security Logs Found'
              : 'No Security Logs Recorded for Today'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {searchTerm || selectedAction !== 'ALL' ? (
              <>
                No audit events for today matched your current filter. Try adjusting your search query or reset action filter to view all events.
              </>
            ) : (
              <>
                There are no security audit logs recorded for today ({formattedToday}) yet. All older records from previous days have been permanently deleted from the database.
              </>
            )}
          </p>

          {(searchTerm || selectedAction !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedAction('ALL');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  );
};
