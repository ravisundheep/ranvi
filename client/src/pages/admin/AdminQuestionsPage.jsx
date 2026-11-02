import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  HelpCircle,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Save,
  Edit,
  Upload,
  Download,
  FileSpreadsheet,
  X,
  Search,
  RotateCcw,
} from 'lucide-react';

export const AdminQuestionsPage = () => {
  const { mockTestId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [bulkQuestions, setBulkQuestions] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const { success, error: toastError } = useToast();

  const [qForm, setQForm] = useState({
    questionText: '',
    subject: 'General Banking',
    topic: 'Regulations',
    marks: 1,
    negativeMarks: 0.25,
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const fetchQuestions = async () => {
    try {
      const res = await adminService.getAdminQuestions(mockTestId);
      if (res.success && res.data) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [mockTestId]);

  const handleOptionTextChange = (idx, text) => {
    const updated = [...qForm.options];
    updated[idx].text = text;
    setQForm({ ...qForm, options: updated });
  };

  const handleSetCorrectOption = (idx) => {
    const updated = qForm.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx,
    }));
    setQForm({ ...qForm, options: updated });
  };

  const handleOpenAdd = () => {
    setEditingQuestionId(null);
    setQForm({
      questionText: '',
      subject: 'General Banking',
      topic: 'Regulations',
      marks: 1,
      negativeMarks: 0.25,
      explanation: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestionId(q._id);
    setQForm({
      questionText: q.questionText || '',
      subject: q.subject || 'General Banking',
      topic: q.topic || '',
      marks: q.marks !== undefined ? q.marks : 1,
      negativeMarks: q.negativeMarks !== undefined ? q.negativeMarks : 0.25,
      explanation: q.explanation || '',
      options:
        q.options && q.options.length >= 2
          ? q.options
          : [
              { text: '', isCorrect: true },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
            ],
    });
    setShowAddModal(true);
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (qForm.options.some((o) => !o.text.trim())) {
      toastError('Please fill in text for all 4 options');
      return;
    }
    try {
      let res;
      if (editingQuestionId) {
        res = await adminService.updateQuestion(editingQuestionId, qForm);
      } else {
        res = await adminService.addQuestion(mockTestId, qForm);
      }
      if (res.success) {
        success(editingQuestionId ? 'Question updated successfully!' : 'Question added to model paper!');
        setShowAddModal(false);
        fetchQuestions();
      }
    } catch (err) {
      toastError(err.message || 'Failed to save question');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question from model test?')) return;
    try {
      const res = await adminService.deleteQuestion(id);
      if (res.success) {
        success('Question deleted');
        fetchQuestions();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete question');
    }
  };

  // CSV parsing & sample download
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
        negativeMarks:
          Number(row.negativemarks) !== undefined && !isNaN(Number(row.negativemarks))
            ? Number(row.negativemarks)
            : 0.25,
        explanation: row.explanation || '',
        options,
      });
    }

    return parsedQuestions;
  };

  const handleBulkFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
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
          toastError('No valid questions parsed from file.');
          return;
        }

        setBulkQuestions(parsed);
        success(`Parsed ${parsed.length} questions ready to import!`);
      } catch (err) {
        toastError('Failed to parse question file: ' + err.message);
      }
    };

    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const headers =
      'questionText,subject,topic,optionA,optionB,optionC,optionD,correctOption,marks,negativeMarks,explanation';
    const row1 =
      '"Which section of Banking Regulation Act 1949 deals with licensing of banking companies?","Banking Law","Licensing","Section 22","Section 11","Section 35","Section 45","A",1,0.25,"Section 22 covers licensing of banking companies."';
    const row2 =
      '"What is the minimum Capital to Risk-Weighted Assets Ratio (CRAR) required under Basel III norms in India?","Prudential Norms","CRAR","9.0%","8.0%","11.5%","10.0%","A",1,0.25,"Under Basel III norms in India, RBI mandates minimum 9% CRAR."';
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, row1, row2].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'mock_test_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkQuestions.length === 0) {
      toastError('Please select a valid CSV or JSON file containing questions.');
      return;
    }

    setSubmittingBulk(true);
    try {
      const res = await adminService.bulkUploadQuestions(mockTestId, bulkQuestions);
      if (res.success) {
        success(`Successfully imported ${bulkQuestions.length} questions!`);
        setShowBulkModal(false);
        setBulkQuestions([]);
        setBulkFileName('');
        fetchQuestions();
      } else {
        toastError(res.message || 'Failed to bulk import questions');
      }
    } catch (err) {
      toastError(err.message || 'Failed to bulk import questions');
    } finally {
      setSubmittingBulk(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.trim().toLowerCase();
    return questions.filter((question) => {
      const text = (question.questionText || '').toLowerCase();
      const subject = (question.subject || '').toLowerCase();
      const topic = (question.topic || '').toLowerCase();
      const explanation = (question.explanation || '').toLowerCase();
      const optionsText = Array.isArray(question.options)
        ? question.options.map((o) => o.text.toLowerCase()).join(' ')
        : '';

      return (
        text.includes(q) ||
        subject.includes(q) ||
        topic.includes(q) ||
        explanation.includes(q) ||
        optionsText.includes(q)
      );
    });
  }, [questions, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/mock-tests"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#12356B]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Model Papers
        </Link>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading">
            Question Bank ({questions.length} MCQs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add multiple choice questions, import via CSV/JSON, designate answer keys, and set step-by-step explanations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setBulkQuestions([]);
              setBulkFileName('');
              setShowBulkModal(true);
            }}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Bulk Import (CSV)
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-[#12356B] hover:bg-[#0e2a56] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      {questions.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative min-w-[240px] sm:min-w-[320px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search question text, subject, options..."
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

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-[#12356B]">{filteredQuestions.length}</span> of {questions.length} Questions
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {questions.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-[#12356B]">No questions yet</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add individual questions or use <strong>Bulk Import (CSV)</strong> to add all questions at once.
            </p>
          </div>
        )}

        {filteredQuestions.length === 0 && questions.length > 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-[#12356B]">No questions match "{searchQuery}"</h4>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs font-bold text-[#1769D2] hover:underline"
            >
              Clear search filter
            </button>
          </div>
        )}

        {filteredQuestions.map((q, idx) => (
          <div key={q._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="font-bold text-[#12356B] bg-[#EAF3FF] px-2.5 py-1 rounded-lg">
                Q#{idx + 1} • {q.subject}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-bold">+{q.marks} Mark</span>
                <span className="text-rose-600 font-bold">-{q.negativeMarks} Neg</span>
                <button
                  onClick={() => handleOpenEdit(q)}
                  className="p-1 text-[#1769D2] hover:text-[#0B1E3D] hover:bg-blue-50 rounded transition-colors"
                  title="Edit Question"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q._id)}
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h4 className="text-sm font-bold text-[#17243A] leading-relaxed">
              {q.questionText}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    opt.isCorrect
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt.text}</span>
                </div>
              ))}
            </div>

            {q.explanation && (
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">Explanation: </span>
                {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#12356B] font-heading">
              {editingQuestionId ? 'Edit Question' : 'Add Question to Model Paper'}
            </h3>

            <form onSubmit={handleSubmitQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Text *</label>
                <textarea
                  required
                  rows="3"
                  value={qForm.questionText}
                  onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })}
                  placeholder="Enter the question text here..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject / Section</label>
                  <input
                    type="text"
                    value={qForm.subject}
                    onChange={(e) => setQForm({ ...qForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Topic</label>
                  <input
                    type="text"
                    value={qForm.topic}
                    onChange={(e) => setQForm({ ...qForm, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marks (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={qForm.marks}
                    onChange={(e) => setQForm({ ...qForm, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Negative Marks (-)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={qForm.negativeMarks}
                    onChange={(e) => setQForm({ ...qForm, negativeMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Multiple Choice Options (Select the correct radio)
                </label>
                {qForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => handleSetCorrectOption(i)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-500 w-4">{String.fromCharCode(65 + i)}</span>
                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1769D2]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Explanation / Solution Notes</label>
                <textarea
                  rows="2"
                  value={qForm.explanation}
                  onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                  placeholder="Explain why the option is correct..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1769D2]"
                />
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
                  {editingQuestionId ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Questions Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xl font-bold text-[#12356B] font-heading flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Bulk Import Questions
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Upload a CSV or JSON file formatted with questions, choices (A-D), and correct answer keys.
            </p>

            <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
              <span className="text-xs font-bold text-[#12356B]">Need the format?</span>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1769D2] hover:underline"
              >
                <Download className="w-4 h-4" /> Download Sample CSV
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-xs text-slate-700">Select File (.csv, .json)</label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleBulkFileSelect}
                className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#12356B] file:text-white hover:file:bg-[#0e2a56] file:cursor-pointer"
              />
            </div>

            {bulkQuestions.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Ready to import {bulkQuestions.length} MCQs from {bulkFileName}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkQuestions.length === 0 || submittingBulk}
                onClick={handleBulkSubmit}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingBulk ? 'Importing Questions...' : `Import ${bulkQuestions.length} Questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
