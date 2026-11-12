import React, { useState, useEffect } from 'react';
import { staffService, courseService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  KeyRound,
  ShieldCheck,
  X,
  CheckCircle2,
  Ban,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'FACULTY', label: 'Faculty / Mentor', color: 'bg-blue-100 text-blue-800' },
  { value: 'SUPPORT_STAFF', label: 'Support Staff', color: 'bg-amber-100 text-amber-800' },
  { value: 'FINANCE_STAFF', label: 'Finance Staff', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'ADMIN', label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-rose-100 text-rose-800' },
];

export const AdminStaffPage = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  const [resetModalStaff, setResetModalStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'FACULTY',
    staffDepartment: '',
    staffDesignation: '',
    assignedCourses: [],
    isActive: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, courseRes] = await Promise.all([
        staffService.getStaff({
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
          search: search || undefined,
        }),
        courseService.getCourses({ includeUnpublished: 'true', limit: 100 }),
      ]);
      if (staffRes?.success && staffRes.data) {
        setStaffList(staffRes.data.staff || []);
      }
      if (courseRes?.success && courseRes.data) {
        setCourses(courseRes.data.courses || []);
      }
    } catch (err) {
      toastError(err.message || 'Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleFilter, search]);

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'FACULTY',
      staffDepartment: '',
      staffDesignation: '',
      assignedCourses: [],
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingStaff(s);
    setFormData({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      password: '',
      role: s.role || 'FACULTY',
      staffDepartment: s.staffDepartment || '',
      staffDesignation: s.staffDesignation || '',
      assignedCourses: Array.isArray(s.assignedCourses)
        ? s.assignedCourses.map((c) => (typeof c === 'object' ? c._id : c))
        : [],
      isActive: s.isActive !== false,
    });
    setModalOpen(true);
  };

  const toggleCourseAssignment = (courseId) => {
    setFormData((prev) => {
      const exists = prev.assignedCourses.includes(courseId);
      return {
        ...prev,
        assignedCourses: exists
          ? prev.assignedCourses.filter((id) => id !== courseId)
          : [...prev.assignedCourses, courseId],
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingStaff) {
        const res = await staffService.updateStaff(editingStaff._id, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          staffDepartment: formData.staffDepartment,
          staffDesignation: formData.staffDesignation,
          assignedCourses: formData.assignedCourses,
          isActive: formData.isActive,
        });
        if (res?.success) success('Staff account updated successfully');
      } else {
        const res = await staffService.createStaff(formData);
        if (res?.success) success(`${formData.role} account created successfully`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toastError(err.message || 'Failed to save staff account');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (s) => {
    if (!window.confirm(`${s.isActive ? 'Deactivate' : 'Activate'} staff account ${s.name}?`)) return;
    try {
      const res = await staffService.updateStaff(s._id, { isActive: !s.isActive });
      if (res?.success) {
        success(`Account ${!s.isActive ? 'activated' : 'deactivated'}`);
        fetchData();
      }
    } catch (err) {
      toastError(err.message || 'Action failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalStaff) return;
    try {
      const res = await staffService.resetStaffPassword(resetModalStaff._id, newPassword);
      if (res?.success) {
        success(res.message);
        setResetModalStaff(null);
        setNewPassword('');
      }
    } catch (err) {
      toastError(err.message || 'Failed to reset password');
    }
  };

  const availableRoleOptions = isSuperAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => !['SUPER_ADMIN', 'ADMIN'].includes(r.value));

  return (
    <div className="md:flex-1 md:min-h-0 flex flex-col gap-6">
      <div className="shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12356B] font-heading flex items-center gap-2">
            <UserCog className="w-6 h-6 text-[#1769D2]" /> Staff Accounts & RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage Faculty, Support Staff, Finance Staff, and Admin accounts with scoped course & role permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-[#0B1E3D] hover:bg-[#12356B] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#F4B942]" /> Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', ...ROLE_OPTIONS.map((r) => r.value)].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                roleFilter === role
                  ? 'bg-[#0B1E3D] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {role === 'ALL' ? 'All Staff Roles' : role.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, dept..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="md:flex-1 md:min-h-0 portal-scroll max-h-[65vh] md:max-h-none pr-1">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[#12356B] border-b border-slate-200">
                <th className="p-4 font-bold">Staff Member</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Dept / Designation</th>
                <th className="p-4 font-bold">Assigned Courses</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    Loading staff directory...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    No staff members found for this filter.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => {
                  const roleMeta = ROLE_OPTIONS.find((r) => r.value === s.role) || ROLE_OPTIONS[0];
                  const canManageTarget = isSuperAdmin || !['SUPER_ADMIN', 'ADMIN'].includes(s.role);
                  const isSelf = String(s._id) === String(currentUser?.id || currentUser?._id);

                  return (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-bold text-[#12356B]">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.email} • {s.phone}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${roleMeta.color}`}>
                          {s.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{s.staffDesignation || '—'}</p>
                        <p className="text-[10.5px] text-slate-400">{s.staffDepartment || 'General'}</p>
                      </td>
                      <td className="p-4 max-w-xs">
                        {s.role === 'FACULTY' ? (
                          s.assignedCourses?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.assignedCourses.slice(0, 3).map((c) => (
                                <span key={c._id || c} className="bg-blue-50 text-[#1769D2] px-2 py-0.5 rounded text-[10px] font-bold">
                                  {c.title || 'Assigned Course'}
                                </span>
                              ))}
                              {s.assignedCourses.length > 3 && (
                                <span className="text-[10px] text-slate-400">+{s.assignedCourses.length - 3} more</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-rose-600 text-[10px] font-bold">No courses assigned</span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">Role-based access</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          s.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.isActive !== false ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                          {s.isActive !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {canManageTarget ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(s)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                              title="Edit Staff Role & Assignments"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetModalStaff(s);
                                setNewPassword('');
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1769D2] cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(s)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                                  s.isActive !== false
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {s.isActive !== false ? 'Disable' : 'Enable'}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">Super Admin only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Create / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#12356B]">
                {editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Provision New Staff Account'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingStaff}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 disabled:bg-slate-100"
                  />
                </div>
                {!editingStaff && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    {availableRoleOptions.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.staffDepartment}
                    onChange={(e) => setFormData({ ...formData, staffDepartment: e.target.value })}
                    placeholder="e.g. Banking"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.staffDesignation}
                    onChange={(e) => setFormData({ ...formData, staffDesignation: e.target.value })}
                    placeholder="e.g. Senior Faculty"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {formData.role === 'FACULTY' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#12356B] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#1769D2]" /> Assigned Courses Scope (Faculty Least Privilege)
                    </span>
                    <span className="text-[10px] text-slate-500">{formData.assignedCourses.length} selected</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {courses.map((c) => (
                      <label key={c._id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-blue-50/40">
                        <input
                          type="checkbox"
                          checked={formData.assignedCourses.includes(c._id)}
                          onChange={() => toggleCourseAssignment(c._id)}
                        />
                        <span className="font-semibold text-slate-800 truncate">{c.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0B1E3D] text-white font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingStaff ? 'Update Staff' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-[#12356B]">Reset Password for {resetModalStaff.name}</h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="password"
                required
                minLength={6}
                placeholder="Enter new temporary password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalStaff(null)}
                  className="py-2 rounded-xl bg-slate-100 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-[#12356B] font-bold text-white cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
