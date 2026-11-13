import React, { useState, useEffect } from 'react';
import { courseService, adminService, uploadService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Video,
  Plus,
  Trash2,
  Edit,
  PlayCircle,
  Lock,
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const AdminLessonsPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  const { success, error: toastError } = useToast();

  const [lessonForm, setLessonForm] = useState({
    moduleTitle: 'Module 1: Core Fundamentals',
    title: '',
    description: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationMinutes: 45,
    sortOrder: 1,
    isPreview: false,
    studyMaterialName: '',
    studyMaterialUrl: '',
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseService.getCourses({ limit: 100, includeUnpublished: 'true', facultyAssigned: 'true' });
        if (res.success && res.data.courses?.length > 0) {
          setCourses(res.data.courses);
          setSelectedCourseId(res.data.courses[0]._id);
          fetchLessons(res.data.courses[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchLessons = async (courseId) => {
    try {
      const res = await courseService.getCourseLessons(courseId);
      if (res.success && res.data) {
        setLessons(res.data.lessons || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCourseChange = (id) => {
    setSelectedCourseId(id);
    fetchLessons(id);
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toastError('Video file size exceeds 500MB limit.');
      return;
    }

    try {
      setUploadingVideo(true);
      setUploadProgress(0);
      const res = await uploadService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });

      if (res.success && res.data?.url) {
        setLessonForm((prev) => ({
          ...prev,
          videoUrl: res.data.url,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        }));
        success('Video uploaded successfully from device!');
      }
    } catch (err) {
      toastError(err.message || 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingLessonId(null);
    setLessonForm({
      moduleTitle: 'Module 1: Core Fundamentals',
      subject: '',
      chapter: '',
      title: '',
      description: '',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      durationMinutes: 45,
      sortOrder: lessons.length + 1,
      isPreview: false,
      studyMaterialName: '',
      studyMaterialUrl: '',
    });
    setUploadProgress(0);
    setShowAddModal(true);
  };

  const handleOpenEdit = (lesson) => {
    setEditingLessonId(lesson._id);
    setLessonForm({
      moduleTitle: lesson.moduleTitle || 'Module 1: Core Fundamentals',
      subject: lesson.subject || '',
      chapter: lesson.chapter || '',
      title: lesson.title || '',
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      durationMinutes: lesson.durationMinutes || 45,
      sortOrder: lesson.sortOrder || 1,
      isPreview: lesson.isPreview || false,
      studyMaterialName: lesson.studyMaterialName || '',
      studyMaterialUrl: lesson.studyMaterialUrl || '',
    });
    setUploadProgress(0);
    setShowAddModal(true);
  };

  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.videoUrl) {
      toastError('Please provide a video URL or upload a video file.');
      return;
    }
    try {
      let res;
      if (editingLessonId) {
        res = await adminService.updateLesson(editingLessonId, {
          ...lessonForm,
          courseId: selectedCourseId,
        });
      } else {
        res = await adminService.createLesson({
          ...lessonForm,
          courseId: selectedCourseId,
        });
      }
      if (res.success) {
        success(editingLessonId ? 'Recorded lesson updated successfully!' : 'Recorded lesson created successfully!');
        setShowAddModal(false);
        fetchLessons(selectedCourseId);
      }
    } catch (err) {
      toastError(err.message || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (id, title) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      const res = await adminService.deleteLesson(id);
      if (res.success) {
        success('Lesson deleted');
        fetchLessons(selectedCourseId);
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete lesson');
    }
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Top Header */}
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1E3D] font-heading">
            Recorded Video Lessons & Media Uploads
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload MP4 videos directly from device or configure stream URLs, demo preview rights, and module chapters.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Upload New Lesson
        </button>
      </div>

      {/* Select Course Dropdown */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <span className="text-xs font-bold text-slate-600 uppercase">Select Course:</span>
        <select
          value={selectedCourseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#12356B] bg-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
        >
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title} ({c.division})
            </option>
          ))}
        </select>
      </div>

      {/* Lessons Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#0B1E3D] border-b border-slate-200">
                <th className="p-4 font-bold">#</th>
                <th className="p-4 font-bold">Module Chapter</th>
                <th className="p-4 font-bold">Lesson Title</th>
                <th className="p-4 font-bold">Duration</th>
                <th className="p-4 font-bold">Access Rights</th>
                <th className="p-4 font-bold">Video Source</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No recorded lessons uploaded for this course yet. Click "Upload New Lesson" to add.
                  </td>
                </tr>
              ) : (
                lessons.map((lesson, idx) => (
                  <tr key={lesson._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700">{lesson.moduleTitle}</div>
                      {(lesson.subject || lesson.chapter) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                          {lesson.subject && (
                            <span className="bg-blue-50 text-[#1769D2] border border-blue-200 px-1.5 py-0.5 rounded font-bold">
                              {lesson.subject}
                            </span>
                          )}
                          {lesson.chapter && <span className="text-slate-400 font-medium">{lesson.chapter}</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-[#0B1E3D]">{lesson.title}</td>
                    <td className="p-4">{lesson.durationMinutes} mins</td>
                    <td className="p-4">
                      {lesson.isPreview ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          Free Demo
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Enrolled Only
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setPreviewVideoUrl(lesson.videoUrl)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1769D2] hover:underline"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Test Play
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(lesson)}
                        className="p-1.5 text-[#1769D2] hover:text-[#0B1E3D] hover:bg-blue-50 rounded-lg transition-colors inline-block"
                        title="Edit Lesson"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                        title="Delete Lesson"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-4 max-w-2xl w-full space-y-3 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <span className="text-xs font-bold">Video Player Playback Test</span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-4 border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-black text-[#0B1E3D] font-heading">
                {editingLessonId ? 'Edit Recorded Video Lesson' : 'Upload Recorded Video Lesson'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLesson} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Module / Paper Section *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.moduleTitle}
                  onChange={(e) => setLessonForm({ ...lessonForm, moduleTitle: e.target.value })}
                  placeholder="e.g. Module 1: Indian Economy Overview"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject (Optional)</label>
                  <input
                    type="text"
                    value={lessonForm.subject}
                    onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
                    placeholder="e.g. Macroeconomics"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chapter (Optional)</label>
                  <input
                    type="text"
                    value={lessonForm.chapter}
                    onChange={(e) => setLessonForm({ ...lessonForm, chapter: e.target.value })}
                    placeholder="e.g. Chapter 3: Inflation & Growth"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g. Monetary Policy Tools & Inflation Targeting"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              {/* Direct Video File Upload Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#0B1E3D] flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#1769D2]" /> Video Media (Upload or URL) *
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12356B] text-white font-bold cursor-pointer hover:bg-[#0e2a56] shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadingVideo && (
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#12356B]">
                      <span>Uploading video file...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1769D2] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="Video URL or uploaded path..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonForm.durationMinutes}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preview Rights</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer font-extrabold text-[#12356B]">
                    <input
                      type="checkbox"
                      checked={lessonForm.isPreview}
                      onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}
                      className="rounded text-[#1769D2] w-4 h-4"
                    />
                    <span>Allow Free Demo Preview</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Study Material PDF Title (Optional)</label>
                <input
                  type="text"
                  value={lessonForm.studyMaterialName}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, studyMaterialName: e.target.value })
                  }
                  placeholder="e.g. JAIIB_IE_IFS_Ch1_Handout.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingVideo}
                  className="py-2.5 px-4 rounded-xl bg-[#12356B] text-white font-extrabold shadow-md hover:bg-[#0e2a56] transition-colors disabled:opacity-50"
                >
                  {editingLessonId ? 'Update Lesson' : 'Save & Publish Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
