import React, { useState, useEffect } from 'react';
import { facultyService, uploadService } from '../../services';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Star,
  Award,
  Upload,
  Search,
  Check,
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

export const AdminFacultyPage = () => {
  const { success, error: toastError } = useToast();
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    designation: 'Senior Banking Faculty',
    qualifications: 'M.Com, CAIIB, Ex-Banker',
    experience: '15+ Years in Banking & Training',
    experienceYears: 15,
    bio: '',
    specialization: 'JAIIB / CAIIB, Banking Law & Financial Operations',
    subjects: 'Principles & Practices of Banking, Indian Economy & IFS',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    email: '',
    phone: '',
    rating: 4.9,
    studentsTrained: '10,000+',
    displayOrder: 0,
    isFeatured: true,
    isActive: true,
  });

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await facultyService.getFacultyList();
      if (res.success && res.data) {
        setFacultyList(res.data);
      }
    } catch (err) {
      toastError('Failed to load faculty profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      designation: 'Senior Banking Faculty',
      qualifications: 'M.Com, CAIIB, Ex-Banker',
      experience: '15+ Years in Banking & Training',
      experienceYears: 15,
      bio: '',
      specialization: 'JAIIB / CAIIB, Banking Law & Financial Operations',
      subjects: 'Principles & Practices of Banking, Indian Economy & IFS',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      email: '',
      phone: '',
      rating: 4.9,
      studentsTrained: '10,000+',
      displayOrder: facultyList.length + 1,
      isFeatured: true,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (faculty) => {
    setEditingId(faculty._id);
    setFormData({
      name: faculty.name || '',
      designation: faculty.designation || '',
      qualifications: faculty.qualifications || '',
      experience: faculty.experience || '',
      experienceYears: faculty.experienceYears || 15,
      bio: faculty.bio || '',
      specialization: faculty.specialization || '',
      subjects: Array.isArray(faculty.subjects) ? faculty.subjects.join(', ') : (faculty.subjects || ''),
      photo: faculty.photo || '',
      email: faculty.email || '',
      phone: faculty.phone || '',
      rating: faculty.rating || 4.9,
      studentsTrained: faculty.studentsTrained || '10,000+',
      displayOrder: faculty.displayOrder || 0,
      isFeatured: faculty.isFeatured ?? true,
      isActive: faculty.isActive ?? true,
    });
    setShowModal(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const res = await uploadService.uploadImage(file);
      if (res.success && res.data) {
        setFormData((prev) => ({ ...prev, photo: res.data.url }));
        success('Faculty photo uploaded successfully!');
      }
    } catch (err) {
      toastError('Photo upload failed. You can paste an image URL directly.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        subjects: typeof formData.subjects === 'string'
          ? formData.subjects.split(',').map((s) => s.trim()).filter(Boolean)
          : formData.subjects,
      };

      if (editingId) {
        const res = await facultyService.updateFaculty(editingId, payload);
        if (res.success) {
          success('Faculty profile updated successfully!');
          setShowModal(false);
          fetchFaculty();
        }
      } else {
        const res = await facultyService.createFaculty(payload);
        if (res.success) {
          success('Faculty profile created successfully!');
          setShowModal(false);
          fetchFaculty();
        }
      }
    } catch (err) {
      toastError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete faculty profile "${name}"?`)) return;

    try {
      const res = await facultyService.deleteFaculty(id);
      if (res.success) {
        success('Faculty profile deleted successfully');
        fetchFaculty();
      }
    } catch (err) {
      toastError(err.message || 'Failed to delete faculty');
    }
  };

  const filteredFaculty = facultyList.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1E3D] font-heading">
            Faculty & Mentors Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Add, update, or remove senior banking faculty and subject mentors displayed across the website.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-[#0B1E3D] hover:bg-[#12356B] text-white px-5 py-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md hover:scale-102 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#F4B942]" /> Add New Faculty
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search faculty by name, specialization, or designation..."
          className="w-full text-sm bg-transparent border-none focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      {/* Faculty Cards Grid */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : filteredFaculty.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((fac) => (
            <div
              key={fac._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={fac.photo}
                    alt={fac.name}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-[#1769D2] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-[#0B1E3D] truncate">{fac.name}</h3>
                      {fac.isFeatured && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#1769D2] mt-0.5">{fac.designation}</p>
                    <p className="text-[11px] text-slate-500">{fac.experience}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <p className="text-slate-700 font-bold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#1769D2] shrink-0" />
                    <span>{fac.specialization}</span>
                  </p>
                  {fac.qualifications && (
                    <p className="text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{fac.qualifications}</span>
                    </p>
                  )}
                </div>

                {fac.bio && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {fac.bio}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {fac.rating} • {fac.studentsTrained}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(fac)}
                    className="p-2 rounded-xl text-[#1769D2] hover:bg-[#EAF3FF] transition-colors"
                    title="Edit Faculty Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(fac._id, fac.name)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Faculty Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-black text-[#0B1E3D]">No Faculty Profiles Found</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add New Faculty" to create a mentor profile.</p>
        </div>
      )}
      </div>

      {/* Faculty Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1769D2]" />
                <h3 className="text-lg font-black text-[#0B1E3D]">
                  {editingId ? 'Edit Faculty Profile' : 'Add New Faculty Profile'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name & Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Sharma (Ex-AGM SBI)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation & Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Chief Academic Director & Banking Mentor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience & Background</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. Ex-General Manager, SBI • 28+ Yrs Exp"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    placeholder="e.g. M.Com, CAIIB, Certified Banking Trainer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specialization Areas</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. JAIIB / CAIIB, Banking Law & Financial Operations"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subjects Taught (comma-separated)</label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="e.g. PPB, AFM, Indian Economy, Speed Math"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo (Upload from Device or URL)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  />
                  <label className="bg-[#EAF3FF] hover:bg-blue-100 text-[#1769D2] px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                    <Upload className="w-4 h-4" />
                    {uploadingPhoto ? 'Uploading...' : 'Upload File'}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                {formData.photo && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={formData.photo} alt="Preview" className="w-12 h-12 rounded-xl object-cover border" />
                    <span className="text-[11px] text-slate-500">Photo Preview Active</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Biography / About Faculty</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Detailed academic background and career mentoring accomplishments..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Students Trained</label>
                  <input
                    type="text"
                    value={formData.studentsTrained}
                    onChange={(e) => setFormData({ ...formData, studentsTrained: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-[#1769D2]"
                  />
                  Featured on Homepage
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-[#1769D2]"
                  />
                  Active Faculty Profile
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs font-black bg-[#0B1E3D] hover:bg-[#12356B] text-white rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Faculty Profile' : 'Save Faculty Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
