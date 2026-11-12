import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Send,
  HelpCircle,
  ShieldAlert,
  FileText,
} from 'lucide-react';

export const ExamTakePage = () => {
  const { mockTestId } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError, warning } = useToast();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // { [questionId]: { selectedOptionIndex, isMarkedForReview } }
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await examService.startExam(mockTestId);
        if (res.success && res.data) {
          setSession(res.data);
          setQuestions(res.data.questions || []);
          setRemainingSeconds(res.data.remainingSeconds ?? 3600);

          // Rehydrate existing responses if resuming
          const initialResp = {};
          if (res.data.responses) {
            res.data.responses.forEach(r => {
              initialResp[r.questionId] = {
                selectedOptionIndex: r.selectedOptionIndex,
                isMarkedForReview: r.isMarkedForReview,
              };
            });
          }
          setResponses(initialResp);
        }
      } catch (err) {
        toastError(err.message || 'Failed to start exam session');
        navigate('/student/mock-tests');
      } finally {
        setLoading(false);
      }
    };
    startSession();
  }, [mockTestId, navigate]);

  // Timer Countdown Effect (runs once per active attemptId; avoids recreating interval every second)
  useEffect(() => {
    if (loading || !session?.attemptId) return;

    if (remainingSeconds <= 0) {
      handleAutoSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, session?.attemptId]);

  const handleAutoSubmit = async () => {
    if (submittedRef.current) return;
    warning('Time has expired! Submitting your exam automatically...');
    await executeSubmission();
  };

  const handleSelectOption = async (optionIdx) => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    const current = responses[qId] || {};

    const updated = {
      ...current,
      selectedOptionIndex: optionIdx,
    };

    setResponses(prev => ({ ...prev, [qId]: updated }));

    // Autosave to backend
    try {
      await examService.saveResponse(session.attemptId, {
        questionId: qId,
        selectedOptionIndex: optionIdx,
        isMarkedForReview: updated.isMarkedForReview || false,
      });
    } catch (err) {
      console.error('Autosave error', err);
    }
  };

  const handleToggleReview = async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    const current = responses[qId] || {};
    const newReviewState = !current.isMarkedForReview;

    const updated = {
      ...current,
      isMarkedForReview: newReviewState,
    };

    setResponses(prev => ({ ...prev, [qId]: updated }));

    try {
      await examService.saveResponse(session.attemptId, {
        questionId: qId,
        selectedOptionIndex: current.selectedOptionIndex,
        isMarkedForReview: newReviewState,
      });
    } catch (err) {
      console.error('Review flag save error', err);
    }
  };

  const handleClearResponse = async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion._id;
    const current = responses[qId] || {};

    const updated = {
      ...current,
      selectedOptionIndex: null,
    };

    setResponses(prev => ({ ...prev, [qId]: updated }));

    try {
      await examService.saveResponse(session.attemptId, {
        questionId: qId,
        selectedOptionIndex: null,
        isMarkedForReview: current.isMarkedForReview || false,
      });
    } catch (err) {
      console.error('Clear response error', err);
    }
  };

  const executeSubmission = async () => {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const res = await examService.submitExam(session.attemptId);
      if (res.success) {
        success('Exam completed! Review your detailed scorecard.');
        navigate(`/student/mock-tests/result/${session.attemptId}`);
      } else {
        submittedRef.current = false;
        setSubmitting(false);
      }
    } catch (err) {
      toastError(err.message || 'Submission failed');
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Preparing test questions securely...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentResp = responses[currentQuestion?._id] || {};

  // Calculate statistics for question palette and submit modal
  let attemptedCount = 0;
  let reviewCount = 0;
  let unattemptedCount = 0;

  questions.forEach(q => {
    const r = responses[q._id];
    if (r && r.selectedOptionIndex !== null && r.selectedOptionIndex !== undefined) {
      attemptedCount++;
    } else {
      unattemptedCount++;
    }
    if (r && r.isMarkedForReview) {
      reviewCount++;
    }
  });

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Top Examination Status Bar */}
      <div className="shrink-0 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-[#1769D2] uppercase tracking-wider">
            Online Examination In Progress
          </span>
          <h1 className="text-lg font-bold text-[#12356B] leading-tight">
            {session?.mockTest?.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timer Box */}
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-black text-sm sm:text-base border shadow-inner ${
            remainingSeconds < 300
              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              : 'bg-[#12356B] text-white border-blue-900'
          }`}>
            <Clock className="w-5 h-5 text-[#F4B942]" />
            <span>{formatTimer(remainingSeconds)} Remaining</span>
          </div>
        </div>
      </div>

      {/* Main Examination Layout */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Question Canvas */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6 min-h-[500px]">
          <div className="space-y-6">
            {/* Question Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#12356B]">
                <span className="bg-[#EAF3FF] text-[#1769D2] px-2.5 py-1 rounded-lg">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-semibold">{currentQuestion?.subject}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">+{currentQuestion?.marks ?? 1} Mark</span>
                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                  {Number(currentQuestion?.negativeMarks ?? 0.25) > 0
                    ? `-${currentQuestion?.negativeMarks ?? 0.25} Neg`
                    : 'No Neg'}
                </span>
              </div>
            </div>

            {/* Question Text & Optional Image */}
            <div className="space-y-4">
              <div className="text-base sm:text-lg font-bold text-[#17243A] leading-relaxed">
                {currentQuestion?.questionText}
              </div>
              {currentQuestion?.questionImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-w-xl">
                  <img
                    src={currentQuestion.questionImage}
                    alt={`Question ${currentIndex + 1} diagram`}
                    className="max-h-72 w-auto object-contain mx-auto p-2"
                  />
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion?.options.map((opt, optIdx) => {
                const isSelected = currentResp.selectedOptionIndex === optIdx;
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 rounded-2xl border text-sm font-semibold transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-[#EAF3FF] border-[#1769D2] text-[#12356B] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-[#1769D2] text-white' : 'bg-white border border-slate-300 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span>{opt.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReview}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  currentResp.isMarkedForReview
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {currentResp.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
              </button>

              <button
                type="button"
                onClick={handleClearResponse}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold text-slate-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-5 py-2 rounded-xl bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  Save & Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  <Send className="w-4 h-4" /> Submit Paper
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Palette & Overview */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#12356B] font-heading">Question Palette</h3>
            <p className="text-[11px] text-slate-400">Click any number to jump directly to that question.</p>
          </div>

          {/* Palette Legend */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>Attempted ({attemptedCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Review ({reviewCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 p-2 rounded-lg border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <span>Unattempted ({unattemptedCount})</span>
            </div>
          </div>

          {/* 1..N Question Grid */}
          <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const r = responses[q._id];
              const isAttempted = r && r.selectedOptionIndex !== null && r.selectedOptionIndex !== undefined;
              const isReview = r && r.isMarkedForReview;
              const isCurrent = idx === currentIndex;

              let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              if (isAttempted) colorClasses = 'bg-emerald-600 text-white border-emerald-600';
              if (isReview) colorClasses = 'bg-amber-500 text-white border-amber-500';

              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center relative ${colorClasses} ${
                    isCurrent ? 'ring-2 ring-[#12356B] ring-offset-2 scale-105' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Submit Exam Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-md"
            >
              <Send className="w-4 h-4" /> Final Submit Examination
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#12356B] font-heading">
                Confirm Exam Submission
              </h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to submit? You cannot modify your answers after final submission.
              </p>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 block">Attempted</span>
                <span className="text-lg font-black text-emerald-800">{attemptedCount}</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] font-bold text-amber-700 block">Review</span>
                <span className="text-lg font-black text-amber-800">{reviewCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">Unanswered</span>
                <span className="text-lg font-black text-slate-700">{unattemptedCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Resume Exam
              </button>
              <button
                onClick={executeSubmission}
                disabled={submitting}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
