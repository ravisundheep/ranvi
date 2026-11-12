import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useRealtimeEvent } from '../../context/SocketContext';
import { ZoomJoinButton } from '../../components/live/ZoomJoinButton';
import { Video, Calendar, Clock, User, ShieldCheck } from 'lucide-react';

export const LiveClassesSchedulePage = () => {
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveClasses = useCallback(async () => {
    try {
      const res = await api.get('/live-classes/student');
      if (res.success && res.data) {
        setLiveClasses(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  useRealtimeEvent('live_classes:updated', useCallback(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]));

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
          Live Zoom Classes & Timetable
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Join your scheduled live batches directly. Please ensure Zoom is installed on your device.
        </p>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading live schedule...</p>
        </div>
      ) : liveClasses.length > 0 ? (
        <div className="space-y-4">
          {liveClasses.map((cls) => (
            <div
              key={cls._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#EAF3FF] text-[#1769D2] uppercase tracking-wider">
                    {cls.courseId?.title || 'Certification Course'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">Batch: {cls.batchName}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{cls.subject}</span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[#12356B] font-heading">{cls.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#1769D2]" /> Faculty: <strong>{cls.facultyName}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#1769D2]" /> {new Date(cls.scheduledDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#1769D2]" /> {cls.startTime} IST ({cls.durationMinutes} mins)
                    </span>
                  </div>
                  {cls.instructions && (
                    <p className="text-xs text-slate-500 italic pt-1">{cls.instructions}</p>
                  )}
                </div>

                <div className="shrink-0">
                  <ZoomJoinButton liveClass={cls} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Video className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#12356B]">No Live Classes Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your live class schedule will appear here when scheduled by your faculty mentors.
          </p>
        </div>
      )}
      </div>
    </div>
  );
};
