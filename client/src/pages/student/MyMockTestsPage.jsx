import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { examService } from '../../services';
import { ExamCard } from '../../components/exams/ExamCard';
import { FileCheck2, Award, Clock, ArrowRight, CheckCircle2, Search, X, Trophy, Users } from 'lucide-react';

export const MyMockTestsPage = () => {
  const [availableTests, setAvailableTests] = useState([]);
  const [pastAttempts, setPastAttempts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [leaderboardModal, setLeaderboardModal] = useState({
    open: false,
    testId: null,
    title: '',
    loading: false,
    data: null,
  });

  const openLeaderboard = async (testId, title) => {
    setLeaderboardModal({ open: true, testId, title, loading: true, data: null });
    try {
      const res = await examService.getMockTestLeaderboard(testId);
      if (res.success && res.data) {
        setLeaderboardModal({ open: true, testId, title, loading: false, data: res.data });
      } else {
        setLeaderboardModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      setLeaderboardModal((prev) => ({ ...prev, loading: false }));
    }
  };

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
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Mock Tests & Model Papers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test your readiness with 10–20 exam pattern papers. Results & solutions available instantly.
          </p>
        </div>
      </div>

      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none space-y-6 pr-1">
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
                    <td className="p-3 text-right space-x-3">
                      <button
                        onClick={() => openLeaderboard(attempt.mockTestId?._id || attempt.mockTestId, attempt.mockTestId?.title)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
                        title="View Leaderboard"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Leaderboard</span>
                      </button>
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
                <ExamCard key={test._id} test={test} isUnlocked={test.isUnlocked} />
              ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-xs text-slate-500">No mock tests found matching "{searchQuery}".</p>
          </div>
        )}
      </div>
      </div>

      {/* Leaderboard Modal */}
      {leaderboardModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#12356B] font-heading">
                    {leaderboardModal.title || 'Mock Test'} Leaderboard
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {leaderboardModal.data?.totalParticipants || 0} Total Participants • Top 50 Ranked
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLeaderboardModal({ open: false, testId: null, title: '', loading: false, data: null })}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 mt-4">
              {leaderboardModal.loading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#1769D2] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-slate-500">Loading rankings...</p>
                </div>
              ) : leaderboardModal.data?.leaderboard?.length > 0 ? (
                <div className="space-y-3">
                  {/* Self rank banner if outside top 3 */}
                  {leaderboardModal.data.selfRank && (
                    <div className="bg-[#EAF3FF] border border-blue-200 p-3 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1769D2]">Your Rank: #{leaderboardModal.data.selfRank.rank}</span>
                      <span className="font-extrabold text-[#12356B]">
                        {leaderboardModal.data.selfRank.bestScore} / {leaderboardModal.data.selfRank.totalMarks} ({leaderboardModal.data.selfRank.accuracyPercentage}% Acc)
                      </span>
                    </div>
                  )}

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                        <th className="p-3 font-bold">Rank</th>
                        <th className="p-3 font-bold">Student</th>
                        <th className="p-3 font-bold">Score</th>
                        <th className="p-3 font-bold">Accuracy</th>
                        <th className="p-3 font-bold text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {leaderboardModal.data.leaderboard.map((entry) => (
                        <tr
                          key={entry.rank}
                          className={`${entry.isSelf ? 'bg-amber-50/60 font-bold' : 'hover:bg-slate-50'}`}
                        >
                          <td className="p-3 font-black text-[#12356B]">
                            {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-[#12356B]">{entry.name}</span>
                            {entry.isSelf && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-200 text-amber-900 uppercase">
                                You
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-black text-[#1769D2]">
                            {entry.bestScore} / {entry.totalMarks}
                          </td>
                          <td className="p-3 font-semibold text-slate-600">{entry.accuracyPercentage}%</td>
                          <td className="p-3 text-right text-slate-500 font-mono text-[11px]">
                            {Math.floor((entry.timeSpentSeconds || 0) / 60)}m {(entry.timeSpentSeconds || 0) % 60}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No submissions yet. Be the first to take this test and top the leaderboard!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
