import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examService } from '../../services';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const ExamResultPage = () => {
  const { attemptId } = useParams();
  const [resultData, setResultData] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await examService.getAttemptResult(attemptId);
        if (res.success && res.data) {
          setResultData(res.data);
          // If passed and not pending, trigger celebration confetti
          if (!res.data.resultPending && res.data.attempt?.isPassed) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
          if (!res.data.resultPending && res.data.attempt?.mockTest?._id && res.data.attempt.mockTest.leaderboardEnabled !== false) {
            try {
              const lbRes = await examService.getLeaderboard(res.data.attempt.mockTest._id);
              if (lbRes?.success && lbRes.data?.enabled) {
                setLeaderboard(lbRes.data);
              }
            } catch {
              // Ignore leaderboard load errors
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500">Calculating your detailed performance scorecard...</p>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-[#12356B]">Result Not Found</h3>
        <Link to="/student/mock-tests" className="text-xs text-[#1769D2] font-bold mt-2 inline-block">
          Return to Mock Tests
        </Link>
      </div>
    );
  }

  const { attempt, questions, resultPending, resultPublishAt } = resultData;

  if (resultPending) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-[#12356B] font-serif">
          Exam Submitted Successfully
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your responses for <strong>{attempt.mockTest?.title}</strong> have been recorded. Results, scorecard, and solutions will be published on{' '}
          <strong className="text-[#0B2545]">
            {new Date(resultPublishAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </strong>.
        </p>
        <div className="pt-2">
          <Link
            to="/student/mock-tests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2545] text-white text-xs font-bold hover:bg-[#1E293B]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  const filteredQuestions = selectedSubjectFilter === 'ALL'
    ? questions
    : questions.filter(q => q.subject === selectedSubjectFilter);

  const subjects = Array.from(new Set(questions.map(q => q.subject))).filter(Boolean);

  const formatDuration = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    const s = (secs || 0) % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Top Header */}
      <div className="shrink-0 flex items-center justify-between">
        <Link
          to="/student/mock-tests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#12356B]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tests
        </Link>
        <span className="text-xs font-bold text-slate-500">
          Completed: {new Date(attempt.submittedAt).toLocaleString()}
        </span>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none space-y-6 pr-1 pb-8">
      {/* Main Score Card Banner */}
      <div className={`p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
        attempt.isPassed
          ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-[#12356B]'
          : 'bg-gradient-to-r from-[#12356B] to-[#1769D2]'
      }`}>
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-extrabold text-[#F4B942]">
            <Award className="w-4 h-4" />
            <span>{attempt.mockTest?.title}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading">
            Score: {attempt.score} <span className="text-lg font-normal text-blue-200">/ {attempt.totalMarks}</span>
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 flex items-center justify-center md:justify-start gap-1.5">
            {attempt.isPassed ? (
              <>
                <Sparkles className="w-4 h-4 text-[#F4B942] shrink-0" />
                <span>Excellent performance! You have cleared the qualifying threshold.</span>
              </>
            ) : (
              <span>Keep practicing! Review the solutions below to strengthen weak topics.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-center">
          <div>
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Accuracy</span>
            <span className="text-2xl font-black text-[#F4B942]">{attempt.accuracyPercentage}%</span>
          </div>
          <div className="border-l border-white/20 pl-4">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Time Taken</span>
            <span className="text-xl font-black text-white">{formatDuration(attempt.timeSpentSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Correct Answers</span>
            <p className="text-2xl font-black text-emerald-700">{attempt.correctCount} MCQs</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Incorrect (Negative Deducted)</span>
            <p className="text-2xl font-black text-rose-700">{attempt.incorrectCount} MCQs</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Unanswered Questions</span>
            <p className="text-2xl font-black text-slate-700">{attempt.unansweredCount} MCQs</p>
          </div>
        </div>
      </div>

      {/* Subject-Wise Analysis */}
      {attempt.subjectAnalysis?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-[#12356B] font-heading">
            Subject-Wise Performance Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attempt.subjectAnalysis.map((sub, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#12356B] truncate">{sub.subject}</h4>
                  <span className="text-xs font-black text-[#1769D2]">Score: {sub.score}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-200">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{sub.correct} Correct</span>
                  </span>
                  <span className="text-rose-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>{sub.incorrect} Wrong</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{sub.unanswered} Left</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Leaderboard */}
      {leaderboard?.entries?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#12356B] font-heading flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F4B942]" /> Test Leaderboard (Top {leaderboard.entries.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by score and completion time.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.entries.map((entry) => (
                  <tr
                    key={`${entry.rank}-${entry.studentCode}`}
                    className={entry.isCurrentUser ? 'bg-blue-50/70 font-bold' : 'hover:bg-slate-50/70'}
                  >
                    <td className="p-3 font-black text-[#0B2545]">#{entry.rank}</td>
                    <td className="p-3">
                      <span className="text-slate-900">{entry.studentName}</span>
                      {entry.isCurrentUser && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-[#1769D2] text-white text-[10px]">You</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-emerald-700">{entry.score} / {entry.totalMarks}</td>
                    <td className="p-3">{entry.accuracyPercentage}%</td>
                    <td className="p-3 font-mono text-slate-600">{formatDuration(entry.timeSpentSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question-By-Question Detailed Solutions Review */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-[#12356B] font-heading">
              Complete Question Solutions & Explanations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review correct answers, your selected response, and in-depth conceptual explanations.
            </p>
          </div>

          {/* Subject Filter */}
          {subjects.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-[#12356B] text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                All Subjects
              </button>
              {subjects.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSubjectFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedSubjectFilter === s
                      ? 'bg-[#1769D2] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const isUserCorrect = q.isCorrect === true;
            const isUserIncorrect = q.isCorrect === false;
            const isUnanswered = q.userSelectedOptionIndex === null || q.userSelectedOptionIndex === undefined;

            return (
              <div
                key={q._id}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4"
              >
                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#12356B] bg-[#EAF3FF] px-2.5 py-1 rounded-lg">
                    Question #{idx + 1} • {q.subject}
                  </span>

                  {isUserCorrect ? (
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{q.marksAwarded})
                    </span>
                  ) : isUserIncorrect ? (
                    <span className="text-rose-700 font-bold bg-rose-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect ({q.marksAwarded})
                    </span>
                  ) : (
                    <span className="text-slate-600 font-bold bg-slate-200 px-3 py-1 rounded-full">
                      Unanswered (0)
                    </span>
                  )}
                </div>

                {/* Question Text & Image */}
                <h4 className="text-base font-bold text-[#17243A] leading-relaxed">
                  {q.questionText}
                </h4>
                {q.questionImage && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white max-w-lg">
                    <img
                      src={q.questionImage}
                      alt={`Question ${idx + 1} figure`}
                      className="max-h-64 w-auto object-contain mx-auto p-2"
                    />
                  </div>
                )}

                {/* Options Review */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = q.userSelectedOptionIndex === optIdx;
                    const isCorrectOpt = opt.isCorrect === true;

                    let bgStyle = 'bg-white border-slate-200 text-slate-700';
                    if (isCorrectOpt) {
                      bgStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isSelected && !isCorrectOpt) {
                      bgStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${bgStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isCorrectOpt ? 'bg-emerald-600 text-white' : isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {isCorrectOpt && (
                          <span className="text-[10px] font-extrabold uppercase text-emerald-700 shrink-0">
                            Correct Answer Key
                          </span>
                        )}
                        {isSelected && !isCorrectOpt && (
                          <span className="text-[10px] font-extrabold uppercase text-rose-600 shrink-0">
                            Your Choice (Incorrect)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/80 text-xs text-blue-950 space-y-1">
                    <span className="font-extrabold text-[#12356B] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <HelpCircle className="w-3.5 h-3.5 text-[#1769D2]" /> Step-By-Step Solution & Explanation:
                    </span>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};
