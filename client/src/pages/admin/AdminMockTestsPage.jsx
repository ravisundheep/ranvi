import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { examService, adminService, courseService, uploadService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  FileCheck2,
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  Eye,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  X,
  AlertCircle,
  FileSpreadsheet,
  FileUp,
  Search,
  RotateCcw,
  Filter,
} from 'lucide-react';

export const AdminMockTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingSolutionPdf, setUploadingSolutionPdf] = useState(false);
  const [submittingUpload, setSubmittingUpload] = useState(false);
  const { success, error: toastError } = useToast();

  const [testForm, setTestForm] = useState({
    title: '',
    paperNumber: 1,
    courseId: '',
    division: 'BANKERS_PATH',
    durationMinutes: 60,
    totalMarks: 100,
    passMarks: 40,
    negativeMarkingPerQuestion: 0.25,
    isDemoFree: false,
    price: 399,
    paperPdfUrl: '',
    paperPdfName: '',
    solutionPdfUrl: '',
    solutionPdfName: '',
    maxAttempts: 0,
    negativeMarkingEnabled: true,
    examMode: 'PRACTICE',
    resultPublishAt: '',
    leaderboardEnabled: true,
  });

  const [uploadForm, setUploadForm] = useState({
    title: '',
    paperNumber: 1,
    courseId: '',
    division: 'BANKERS_PATH',
    durationMinutes: 60,
    totalMarks: 100,
    passMarks: 40,
    negativeMarkingPerQuestion: 0.25,
    isDemoFree: false,
    price: 399,
    paperPdfUrl: '',
    paperPdfName: '',
    solutionPdfUrl: '',
    solutionPdfName: '',
  });

  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [questionsFileName, setQuestionsFileName] = useState('');

  const fetchTests = async () => {
    try {
      const [testRes, courseRes] = await Promise.all([
        examService.getMockTests({ limit: 50, includeUnpublished: 'true' }),
        courseService.getCourses({ limit: 100, includeUnpublished: 'true', facultyAssigned: 'true' }),
      ]);
      if (testRes.success && testRes.data) {
        setTests(testRes.data.tests || []);
      }
      if (courseRes.success && courseRes.data) {
        setCourses(courseRes.data.courses || []);
        if (courseRes.data.courses?.length > 0 && !testForm.courseId) {
          setTestForm((prev) => ({ ...prev, courseId: courseRes.data.courses[0]._id }));
          setUploadForm((prev) => ({ ...prev, courseId: courseRes.data.courses[0]._id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleOpenAdd = () => {
    setEditingTestId(null);
    setTestForm({
      title: '',
      paperNumber: tests.length + 1,
      courseId: courses[0]?._id || '',
      division: 'BANKERS_PATH',
      durationMinutes: 60,
      totalMarks: 100,
      passMarks: 40,
      negativeMarkingPerQuestion: 0.25,
      isDemoFree: false,
      price: 399,
      paperPdfUrl: '',
      paperPdfName: '',
      solutionPdfUrl: '',
      solutionPdfName: '',
      maxAttempts: 0,
      negativeMarkingEnabled: true,
      examMode: 'PRACTICE',
      resultPublishAt: '',
      leaderboardEnabled: true,
    });
    setShowAddModal(true);
  };

  const handleOpenUploadModal = () => {
    setUploadForm({
      title: '',
      paperNumber: tests.length + 1,
      courseId: courses[0]?._id || '',
      division: 'BANKERS_PATH',
      durationMinutes: 60,
      totalMarks: 100,
      passMarks: 40,
      negativeMarkingPerQuestion: 0.25,
      isDemoFree: false,
      price: 399,
      paperPdfUrl: '',
      paperPdfName: '',
      solutionPdfUrl: '',
      solutionPdfName: '',
    });
    setUploadedQuestions([]);
    setQuestionsFileName('');
    setShowUploadModal(true);
  };

  const handleOpenEdit = (test) => {
    setEditingTestId(test._id);
    setTestForm({
      title: test.title || '',
      paperNumber: test.paperNumber || 1,
      courseId: test.courseId?._id || test.courseId || '',
      division: test.division || 'BANKERS_PATH',
      durationMinutes: test.durationMinutes || 60,
      totalMarks: test.totalMarks || 100,
      passMarks: test.passMarks || 40,
      negativeMarkingPerQuestion: test.negativeMarkingPerQuestion !== undefined ? test.negativeMarkingPerQuestion : 0.25,
      isDemoFree: test.isDemoFree ?? false,
      price: test.price || 0,
      paperPdfUrl: test.paperPdfUrl || '',
      paperPdfName: test.paperPdfName || '',
      solutionPdfUrl: test.solutionPdfUrl || '',
      solutionPdfName: test.solutionPdfName || '',
      maxAttempts: test.maxAttempts !== undefined ? test.maxAttempts : 0,
      negativeMarkingEnabled: test.negativeMarkingEnabled !== undefined ? test.negativeMarkingEnabled : true,
      examMode: test.examMode || 'PRACTICE',
      resultPublishAt: test.resultPublishAt ? new Date(test.resultPublishAt).toISOString().slice(0, 16) : '',
      leaderboardEnabled: test.leaderboardEnabled !== undefined ? test.leaderboardEnabled : true,
    });
    setShowAddModal(true);
  };

  // Upload Paper PDF Handler
  const handlePdfUpload = async (e, isUploadModal = false, isSolution = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toastError('File size exceeds 50MB limit');
      return;
    }

    if (isSolution) {
      setUploadingSolutionPdf(true);
    } else {
      setUploadingPdf(true);
    }

    try {
      const res = await uploadService.uploadDocument(file);
      if (res.success && res.data) {
        const fileUrl = res.data.url || res.data.path;
        const fileName = res.data.name || file.name;

        if (isUploadModal) {
          setUploadForm((prev) => ({
            ...prev,
            [isSolution ? 'solutionPdfUrl' : 'paperPdfUrl']: fileUrl,
            [isSolution ? 'solutionPdfName' : 'paperPdfName']: fileName,
          }));
        } else {
          setTestForm((prev) => ({
            ...prev,
            [isSolution ? 'solutionPdfUrl' : 'paperPdfUrl']: fileUrl,
            [isSolution ? 'solutionPdfName' : 'paperPdfName']: fileName,
          }));
        }
        success(isSolution ? 'Solution paper uploaded successfully' : 'Question paper uploaded successfully');
      } else {
        toastError('Failed to upload file');
      }
    } catch (err) {
      toastError(err.message || 'File upload failed');
    } finally {
      if (isSolution) {
        setUploadingSolutionPdf(false);
      } else {
        setUploadingPdf(false);
      }
    }
  };

  // CSV Questions Parser
  const parseCsvQuestions = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const parsedQuestions = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length < 4) continue;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      const questionText = row.questiontext || row.question || values[0];
      if (!questionText) continue;

      const optA = row.optiona || row.a || values[3] || 'Option A';
      const optB = row.optionb || row.b || values[4] || 'Option B';
      const optC = row.optionc || row.c || values[5] || 'Option C';
      const optD = row.optiond || row.d || values[6] || 'Option D';
      const correctVal = (row.correctoption || row.answer || row.correct || 'A').toUpperCase().trim();

      const options = [
        { text: optA, isCorrect: correctVal === 'A' || correctVal === '1' || correctVal === optA },
        { text: optB, isCorrect: correctVal === 'B' || correctVal === '2' || correctVal === optB },
        { text: optC, isCorrect: correctVal === 'C' || correctVal === '3' || correctVal === optC },
        { text: optD, isCorrect: correctVal === 'D' || correctVal === '4' || correctVal === optD },
      ];

      if (!options.some((o) => o.isCorrect)) {
        options[0].isCorrect = true;
      }

      parsedQuestions.push({
        questionText,
        subject: row.subject || 'General Banking',
        topic: row.topic || 'Model Questions',
        marks: Number(row.marks) || 1,
        negativeMarks: Number(row.negativemarks) !== undefined && !isNaN(Number(row.negativemarks)) ? Number(row.negativemarks) : 0.25,
        explanation: row.explanation || '',
        options,
      });
    }

    return parsedQuestions;
  };

  const handleQuestionsFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQuestionsFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;

        let parsed = [];
        if (file.name.endsWith('.json')) {
          const raw = JSON.parse(text);
          parsed = Array.isArray(raw) ? raw : raw.questions || [];
        } else {
          parsed = parseCsvQuestions(text);
        }

        if (parsed.length === 0) {
          toastError('No valid questions found in file. Please check the template format.');
          return;
        }

        setUploadedQuestions(parsed);
        success(`Parsed ${parsed.length} questions successfully!`);
      } catch (err) {
        toastError('Failed to parse question file: ' + err.message);
      }
    };

    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const headers = 'questionText,subject,topic,optionA,optionB,optionC,optionD,correctOption,marks,negativeMarks,explanation';
    const row1 =
      '"Which section of Banking Regulation Act 1949 deals with licensing of banking companies?","Banking Law","Licensing","Section 22","Section 11","Section 35","Section 45","A",1,0.25,"Section 22 covers licensing of banking companies."';
    const row2 =
      '"What is the minimum Capital to Risk-Weighted Assets Ratio (CRAR) required under Basel III norms in India?","Prudential Norms","CRAR","9.0%","8.0%","11.5%","10.0%","A",1,0.25,"Under Basel III norms in India, RBI mandates minimum 9% CRAR."';
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, row1, row2].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'mock_test_questions_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingTestId) {
        res = await adminService.updateMockTest(editingTestId, testForm);
      } else {
        res = await adminService.createMockTest(testForm);
      }
      if (res.success) {
        success(editingTestId ? 'Model paper updated successfully!' : 'Model paper created successfully!');
        setShowAddModal(false);
        fetchTests();
      }
    } catch (err) {
      toastError(err.message || 'Failed to save mock test');
    }
  };

  const handleSubmitUploadPaper = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      toastError('Please enter a paper title');
      return;
    }

    setSubmittingUpload(true);
    try {
      const payload = {
        ...uploadForm,
        questions: uploadedQuestions,
      };

      const res = await adminService.uploadMockTestPaper(payload);
      if (res.success) {
        success(
          `Test paper uploaded successfully with ${uploadedQuestions.length > 0 ? uploadedQuestions.length + ' online questions!' : 'PDF paper document!'}`
        );
        setShowUploadModal(false);
        fetchTests();
      } else {
        toastError(res.message || 'Failed to upload mock test paper');
      }
    } catch (err) {
      toastError(err.message || 'Failed to upload mock test paper');
    } finally {
      setSubmittingUpload(false);
    }
  };

  const handleDeleteTest = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete mock test "${title}" and all its questions?`)) return;
    try {
      const res = await adminService.deleteMockTest(id);
      if (res.success) {
        success('Model paper and its questions deleted successfully');
        fetchTests();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete mock test');
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (divisionFilter !== 'ALL' && t.division !== divisionFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const title = (t.title || '').toLowerCase();
        const division = (t.division || '').toLowerCase();
        const paperName = (t.paperPdfName || '').toLowerCase();
        const courseName = (t.courseId?.title || '').toLowerCase();

        const matches =
          title.includes(q) ||
          division.includes(q) ||
          paperName.includes(q) ||
          courseName.includes(q);

        if (!matches) return false;
      }
      return true;
    });
  }, [tests, divisionFilter, searchQuery]);

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Header Bar */}
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Mock Tests & 10–20 Model Papers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload question paper PDFs, configure timer & negative marking, and manage online CBT question banks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenUploadModal}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload Mock Test Paper
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Model Paper
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Division Filter */}
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 outline-none focus:border-[#1769D2]"
          >
            <option value="ALL">All Divisions</option>
            <option value="BANKERS_PATH">Banker's Path</option>
            <option value="COMPETITIVE_EXAMS">Competitive Exams</option>
            <option value="ENTRANCE_EXAMS">Entrance Exams</option>
          </select>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search paper title, document name..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
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

          {(divisionFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setDivisionFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-[#12356B]">{filteredTests.length}</span> of {tests.length} Model Papers
        </div>
      </div>

      {/* Tests Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                <th className="p-4 font-bold">Paper Title & Documents</th>
                <th className="p-4 font-bold">Division</th>
                <th className="p-4 font-bold">Duration</th>
                <th className="p-4 font-bold">Total Marks</th>
                <th className="p-4 font-bold">Online MCQs</th>
                <th className="p-4 font-bold">Access Type</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTests.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                    No mock test papers found matching your search and filter criteria.
                  </td>
                </tr>
              )}
              {filteredTests.map((test) => (
                <tr key={test._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[#12356B] text-sm">
                      {test.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {test.paperPdfUrl ? (
                        <a
                          href={test.paperPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md transition-colors"
                          title="View / Download Original Question Paper PDF"
                        >
                          <FileText className="w-3 h-3 text-rose-600" />
                          {test.paperPdfName || 'Question Paper PDF'}
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">No PDF attached</span>
                      )}

                      {test.solutionPdfUrl && (
                        <a
                          href={test.solutionPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-colors"
                          title="View Solution Paper"
                        >
                          <FileText className="w-3 h-3 text-blue-600" />
                          Solution PDF
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1769D2] uppercase">
                      {test.division === 'BANKERS_PATH' ? "Banker's Path" : 'Competitive Exam'}
                    </span>
                  </td>
                  <td className="p-4">{test.durationMinutes} mins</td>
                  <td className="p-4 font-bold">{test.totalMarks}</td>
                  <td className="p-4 font-extrabold text-[#1769D2]">
                    {test.totalQuestions || 0} MCQs
                  </td>
                  <td className="p-4">
                    {test.isDemoFree ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-extrabold text-[10px]">
                        FREE DEMO
                      </span>
                    ) : (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-extrabold text-[10px]">
                        PAID / ENROLLED
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                    {test.paperPdfUrl && (
                      <a
                        href={test.paperPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg inline-block transition-colors"
                        title="Open Question Paper PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      to={`/admin/mock-tests/${test._id}/questions`}
                      className="inline-flex items-center gap-1 bg-[#12356B] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#0e2a56] transition-colors"
                      title="Manage Question Bank"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#F4B942]" /> MCQs
                    </Link>
                    <button
                      onClick={() => handleOpenEdit(test)}
                      className="p-1.5 text-[#1769D2] hover:text-[#0B1E3D] hover:bg-blue-50 rounded-lg transition-colors inline-block"
                      title="Edit Model Paper"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test._id, test.title)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                      title="Delete Model Paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* ========================================================================= */}
      {/* Upload Mock Test Paper Modal (New Feature) */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#12356B] font-heading">
                    Upload Mock Test Paper
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload official Question Paper document & import online CBT questions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUploadPaper} className="space-y-5 text-xs">
              {/* Paper Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Paper Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="e.g. JAIIB 2026 Model Test Paper 14 - Principles of Banking"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1769D2] text-sm"
                />
              </div>

              {/* Course & Division */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Division *</label>
                  <select
                    value={uploadForm.division}
                    onChange={(e) => setUploadForm({ ...uploadForm, division: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="BANKERS_PATH">Banker's Path (JAIIB / CAIIB)</option>
                    <option value="COMPETITIVE_EXAMS">Competitive Exams (IBPS / SBI / SSC)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Associated Course</label>
                  <select
                    value={uploadForm.courseId}
                    onChange={(e) => setUploadForm({ ...uploadForm, courseId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">General / All Enrolled Students</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specs: Paper #, Duration, Total Marks, Negative Marking */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paper #</label>
                  <input
                    type="number"
                    value={uploadForm.paperNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, paperNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={uploadForm.durationMinutes}
                    onChange={(e) => setUploadForm({ ...uploadForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={uploadForm.totalMarks}
                    onChange={(e) => setUploadForm({ ...uploadForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.05"
                    value={uploadForm.negativeMarkingPerQuestion}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, negativeMarkingPerQuestion: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* SECTION: Question Paper PDF Document */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#12356B] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-600" />
                    Question Paper Document (PDF / DOCX) *
                  </label>
                  <span className="text-[10px] text-slate-500">Max size: 50MB</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => handlePdfUpload(e, true, false)}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#12356B] file:text-white hover:file:bg-[#0e2a56] file:cursor-pointer"
                  />
                  {uploadingPdf && (
                    <span className="text-xs text-[#1769D2] font-bold animate-pulse whitespace-nowrap">
                      Uploading PDF...
                    </span>
                  )}
                </div>

                {uploadForm.paperPdfUrl && (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      {uploadForm.paperPdfName || 'Question Paper PDF Uploaded'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={uploadForm.paperPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1769D2] font-bold hover:underline"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={() => setUploadForm({ ...uploadForm, paperPdfUrl: '', paperPdfName: '' })}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: Optional Solution PDF Document */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-[#12356B] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    Answer Key / Explanations Paper (Optional PDF)
                  </label>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => handlePdfUpload(e, true, true)}
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-700 file:text-white hover:file:bg-slate-800 file:cursor-pointer"
                  />
                  {uploadingSolutionPdf && (
                    <span className="text-xs text-[#1769D2] font-bold animate-pulse whitespace-nowrap">
                      Uploading Solution...
                    </span>
                  )}
                </div>

                {uploadForm.solutionPdfUrl && (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-blue-200 text-xs">
                    <span className="font-bold text-blue-800 flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      {uploadForm.solutionPdfName || 'Solution Paper Uploaded'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadForm({ ...uploadForm, solutionPdfUrl: '', solutionPdfName: '' })}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION: Interactive CBT Question Bank (CSV / JSON Bulk Import) */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-extrabold text-[#12356B] flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-[#1769D2]" />
                      Import Interactive CBT Questions (CSV / JSON)
                    </label>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Allows students to take this paper online with interactive timer & auto-scoring.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1769D2] bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Sample CSV Template
                  </button>
                </div>

                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleQuestionsFileSelect}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1769D2] file:text-white hover:file:bg-[#12356B] file:cursor-pointer"
                />

                {uploadedQuestions.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {uploadedQuestions.length} MCQs ready to import from{' '}
                      <strong>{questionsFileName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedQuestions([]);
                        setQuestionsFileName('');
                      }}
                      className="text-rose-500 font-bold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Free Demo Checkbox */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#12356B]">
                  <input
                    type="checkbox"
                    checked={uploadForm.isDemoFree}
                    onChange={(e) => setUploadForm({ ...uploadForm, isDemoFree: e.target.checked })}
                    className="rounded text-[#1769D2]"
                  />
                  <span>Mark as Free Demo Test (Accessible to all students without fee)</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpload}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingUpload ? (
                    <>Uploading Test Paper...</>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4" /> Save & Publish Paper
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Standard Add / Edit Mock Test Modal */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full my-8 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xl font-bold text-[#12356B] font-heading">
                {editingTestId ? 'Edit Model Test Paper' : 'Create New Model Test Paper'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="e.g. JAIIB 2026 Full Length Model Paper 13"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Division *</label>
                  <select
                    value={testForm.division}
                    onChange={(e) => setTestForm({ ...testForm, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="BANKERS_PATH">Banker's Path</option>
                    <option value="COMPETITIVE_EXAMS">Competitive Exams</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paper #</label>
                  <input
                    type="number"
                    value={testForm.paperNumber}
                    onChange={(e) => setTestForm({ ...testForm, paperNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={testForm.durationMinutes}
                    onChange={(e) => setTestForm({ ...testForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={testForm.totalMarks}
                    onChange={(e) => setTestForm({ ...testForm, totalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.05"
                    value={testForm.negativeMarkingPerQuestion}
                    onChange={(e) =>
                      setTestForm({ ...testForm, negativeMarkingPerQuestion: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Attempts (0 = Unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={testForm.maxAttempts}
                    onChange={(e) => setTestForm({ ...testForm, maxAttempts: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#12356B]">
                    <input
                      type="checkbox"
                      checked={testForm.negativeMarkingEnabled}
                      onChange={(e) => setTestForm({ ...testForm, negativeMarkingEnabled: e.target.checked })}
                      className="rounded text-[#1769D2]"
                    />
                    <span>Enable Negative Marking</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Mode</label>
                  <select
                    value={testForm.examMode}
                    onChange={(e) => setTestForm({ ...testForm, examMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="PRACTICE">Practice Mode (Instant Result)</option>
                    <option value="EXAM">Formal Exam Mode (Scheduled Result)</option>
                  </select>
                </div>

                {testForm.examMode === 'EXAM' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Result Publish Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      value={testForm.resultPublishAt}
                      onChange={(e) => setTestForm({ ...testForm, resultPublishAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                ) : (
                  <div className="flex items-end pb-2">
                    <span className="text-[11px] text-slate-500">Results &amp; solutions appear immediately after submission.</span>
                  </div>
                )}

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#12356B]">
                    <input
                      type="checkbox"
                      checked={testForm.leaderboardEnabled}
                      onChange={(e) => setTestForm({ ...testForm, leaderboardEnabled: e.target.checked })}
                      className="rounded text-[#1769D2]"
                    />
                    <span>Enable Student Leaderboard (Top 20 Ranks)</span>
                  </label>
                </div>
              </div>

              {/* Attach / Update Question Paper PDF */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 block">
                  Question Paper Document (PDF)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => handlePdfUpload(e, false, false)}
                    className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#12356B] file:text-white"
                  />
                  {uploadingPdf && (
                    <span className="text-xs text-[#1769D2] font-bold animate-pulse">Uploading...</span>
                  )}
                </div>
                {testForm.paperPdfUrl && (
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <span className="font-medium text-slate-700 truncate">
                      {testForm.paperPdfName || 'Paper PDF Attached'}
                    </span>
                    <a
                      href={testForm.paperPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1769D2] font-bold hover:underline shrink-0 ml-2"
                    >
                      Preview
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#12356B]">
                  <input
                    type="checkbox"
                    checked={testForm.isDemoFree}
                    onChange={(e) => setTestForm({ ...testForm, isDemoFree: e.target.checked })}
                    className="rounded text-[#1769D2]"
                  />
                  <span>Mark as Free Demo Test (Accessible without payment)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-[#12356B] text-white font-bold shadow-md hover:bg-[#0e2a56] transition-colors"
                >
                  {editingTestId ? 'Update Model Paper' : 'Save Model Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
