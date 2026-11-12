import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  HelpCircle,
  Award,
  CheckCircle2,
  PlayCircle,
  Lock,
  ShieldCheck,
  Zap,
  FileText,
  FileDown,
} from 'lucide-react';

export const ExamCard = ({ test, onTakeTest, isUnlocked }) => {
  const isFree = test.isDemoFree || isUnlocked;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 group">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-[#EAF3FF] text-[#1769D2] border border-blue-200">
              Paper {test.paperNumber < 10 ? `0${test.paperNumber}` : test.paperNumber}
            </span>

            {test.paperPdfUrl && (
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <FileText className="w-3 h-3 text-rose-600" /> PDF Paper
              </span>
            )}
          </div>

          {test.isDemoFree ? (
            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" /> Free Mock Test
            </span>
          ) : isUnlocked ? (
            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" /> Enrolled Access
            </span>
          ) : (
            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Premium Paper
            </span>
          )}
        </div>

        <h3 className="text-base font-black text-[#0B1E3D] font-heading mb-2 leading-snug line-clamp-2 group-hover:text-[#1769D2] transition-colors">
          {test.title}
        </h3>

        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {test.description ||
            'Full pattern computer-based mock exam with live timer, negative marking, and detailed step-by-step solutions.'}
        </p>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 px-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 mb-4 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black block">Questions</span>
            <span className="font-black text-[#0B1E3D]">{test.totalQuestions || 10} MCQs</span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-black block">Duration</span>
            <span className="font-black text-[#0B1E3D]">{test.durationMinutes} Mins</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-black block">Total Marks</span>
            <span className="font-black text-[#0B1E3D]">{test.totalMarks} Marks</span>
          </div>
        </div>
      </div>

      <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs">
          <span className="text-slate-400 block text-[10px] font-bold">Negative Marking</span>
          <span className="font-extrabold text-rose-600">
            {Number(test.negativeMarkingPerQuestion ?? 0.25) > 0
              ? `-${test.negativeMarkingPerQuestion ?? 0.25} per wrong`
              : 'No negative marks'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {test.paperPdfUrl && isFree && (
            <a
              href={test.paperPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-2.5 rounded-xl border border-rose-200 transition-all hover:scale-105"
              title="Download or view official question paper PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" /> PDF Paper
            </a>
          )}

          {isFree ? (
            <Link
              to={`/student/mock-tests/${test._id}/take`}
              className="inline-flex items-center gap-1.5 bg-[#0B1E3D] hover:bg-[#12356B] text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md hover:scale-105"
            >
              <PlayCircle className="w-4 h-4 text-[#F4B942]" /> Start Test
            </Link>
          ) : (
            <Link
              to={`/checkout?type=MOCK_TEST_PACKAGE&id=${test._id}`}
              className="inline-flex items-center gap-1.5 bg-[#1769D2] hover:bg-[#12356B] text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md hover:scale-105"
            >
              <Lock className="w-3.5 h-3.5" /> Unlock ₹{test.price || 399}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
