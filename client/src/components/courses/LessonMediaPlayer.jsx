import React from 'react';
import { Lock } from 'lucide-react';

const getEmbedUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();

  // YouTube watch / short / live / embed URLs
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }

  // Vimeo URLs
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
};

export const LessonMediaPlayer = ({ lesson, poster = '', autoPlay = false }) => {
  if (!lesson) return null;

  if (!lesson.videoUrl) {
    return (
      <div className="aspect-video w-full bg-slate-950 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-300 border border-white/10">
        <Lock className="w-10 h-10 text-[#F4B942] mb-2" />
        <p className="text-sm font-bold text-white">Video Lesson Locked or Unavailable</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          {lesson.isUnlocked === false
            ? 'Enrol in this program to unlock full HD recorded lectures and notes.'
            : 'Video media has not been uploaded for this lesson yet.'}
        </p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(lesson.videoUrl);

  return (
    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-inner">
      {embedUrl ? (
        <iframe
          key={lesson._id || embedUrl}
          src={embedUrl}
          title={lesson.title || 'Course Video Lesson'}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          key={lesson._id || lesson.videoUrl}
          src={lesson.videoUrl}
          poster={poster || undefined}
          controls
          controlsList="nodownload"
          autoPlay={autoPlay}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
};
