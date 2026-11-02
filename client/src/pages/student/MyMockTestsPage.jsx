import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { examService } from '../../services';
import { ExamCard } from '../../components/exams/ExamCard';
import { FileCheck2, Award, Clock, ArrowRight, CheckCircle2, Search, X } from 'lucide-react';

export const MyMockTestsPage = () => {
  const [availableTests, setAvailableTests] = useState([]);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const [testsRes, historyRes] = await Promise.all([
          examService.getMockTests({ limit: 30 }),
          examService.getMyExamHistory(),
        ]);

        if (testsRes.success) setAvailableTests(testsRes.data.tests || []);
        if (historyRes.success) setPastAttempts(historyRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Mock Tests & Model Papers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test your readiness with 10–20 exam pattern papers. Results & solutions available instantly.
          </p>
        </div>
      </div>

      {/* Past Attempts Summary Table */}
      {pastAttempts.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-[#12356B] font-heading">
            Your Previous Test Scores & Results
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                  <th className="p-3 font-bold">Paper Title</th>
                  <th className="p-3 font-bold">Date Taken</th>
                  <th className="p-3 font-bold">Score</th>
                  <th className="p-3 font-bold">Accuracy</th>
                  <th className="p-3 font-bold">Result</th>
                  <th className="p-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pastAttempts.map((attempt) => (
                  <tr key={attempt._id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-[#12356B]">{attempt.mockTestId?.title}</td>
                    <td className="p-3 text-slate-500">{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                    <td className="p-3 font-black text-[#12356B]">
                      {attempt.score} / {attempt.totalMarks}
                    </td>
                    <td className="p-3 font-bold text-[#1769D2]">{attempt.accuracyPercentage}%</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        attempt.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {attempt.isPassed ? 'Passed' : 'Needs Practice'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/student/mock-tests/result/${attempt._id}`}
                        className="text-xs font-bold text-[#1769D2] hover:underline inline-flex items-center gap-1"
                      >
                        <span>View Solutions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Model Papers Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-[#12356B] font-heading">
            Available 10–20 Model Test Papers
          </h3>

          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search available tests..."
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading model papers...</p>
          </div>
        ) : availableTests.filter(
            (t) =>
              !searchQuery.trim() ||
              t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
          ).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTests
              .filter(
                (t) =>
                  !searchQuery.trim() ||
                  t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
              )
              .map((test) => (
                <ExamCard key={test._id} test={test} isUnlocked={true} />
              ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-500">No mock tests found matching "{searchQuery}".</p>
          </div>
        )}
      </div>
    </div>
  );
};
