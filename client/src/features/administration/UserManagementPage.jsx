import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, UserX, UserCheck, RefreshCw, Lock, FileText, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import AlertBanner from '../../components/common/AlertBanner';
import Skeleton from '../../components/common/Skeleton';

export function UserManagementPage() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'audit'
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // New user modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'BUREAU_OFFICER',
    primaryBureau: 'REGULATION_BUREAU',
    region: 'ALL'
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: `Failed to load users: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/audit-logs');
      if (res.success) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: `Failed to load audit logs: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.is_active;
      const res = await apiClient.patch(`/admin/users/${user.id}/status`, { isActive: newStatus });
      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: `Account for ${user.username} is now ${newStatus ? 'Activated' : 'Deactivated'}.`
        });
        fetchUsers();
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: err.message });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await apiClient.post('/admin/users', formData);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: `Officer account '${formData.username}' provisioned successfully.`
        });
        setIsModalOpen(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          fullName: '',
          role: 'BUREAU_OFFICER',
          primaryBureau: 'REGULATION_BUREAU',
          region: 'ALL'
        });
        fetchUsers();
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage officer credentials, roles, bureau jurisdictions, and review immutable security audit logs.
          </p>
        </div>

        {activeTab === 'users' && (
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => setIsModalOpen(true)}
          >
            Provision Officer Account
          </Button>
        )}
      </div>

      {statusMessage && (
        <AlertBanner
          variant={statusMessage.type}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.message}
        </AlertBanner>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-gov-700 text-gov-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Authorized Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-gov-700 text-gov-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security Audit Trail
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3 text-left">Officer Name & ID</th>
                  <th className="px-6 py-3 text-left">Assigned Role</th>
                  <th className="px-6 py-3 text-left">Bureau / Region Scope</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading user accounts...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{u.full_name || u.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.username} • {u.email}</div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            u.role === 'ADMIN' ? 'danger' :
                            u.role === 'SENIOR_OFFICIAL' ? 'warning' : 'primary'
                          }
                          size="sm"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                        {u.primary_bureau || u.primaryBureau || u.region || 'ALL'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-right">
                        {u.role !== 'ADMIN' && (
                          <Button
                            variant={u.is_active ? 'ghost' : 'outline'}
                            size="sm"
                            className={u.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 border-emerald-600 hover:bg-emerald-50'}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3 text-left">Timestamp</th>
                  <th className="px-6 py-3 text-left">Security Event</th>
                  <th className="px-6 py-3 text-left">Actor Username</th>
                  <th className="px-6 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-sans">
                      Loading audit events...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-sans">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.event_type.includes('FAIL') || log.event_type.includes('DENIED')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap font-sans font-semibold text-slate-900">
                        {log.username || 'Anonymous'}
                      </td>
                      <td className="px-6 py-3 text-slate-600 max-w-xs truncate">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Provision Officer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Authorized Officer Account"
        description="Create an authorized credential set. The officer's password will be hashed using bcrypt."
      >
        <form onSubmit={handleCreateUser} className="space-y-3 text-left">
          <Input
            label="Officer Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Dr. Sunita Rao"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. officer_rao"
              required
            />
            <Input
              label="Official Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="s.rao@aicte.gov.in"
              required
            />
          </div>

          <Input
            label="Initial Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••••••"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'BUREAU_OFFICER', label: 'Bureau Officer' },
                { value: 'REGIONAL_OFFICER', label: 'Regional Officer' },
                { value: 'SENIOR_OFFICIAL', label: 'Senior Official' },
                { value: 'ADMIN', label: 'System Administrator' },
              ]}
              required
            />

            <Select
              label="Assigned Bureau"
              value={formData.primaryBureau}
              onChange={(e) => setFormData({ ...formData, primaryBureau: e.target.value })}
              options={[
                { value: 'REGULATION_BUREAU', label: 'Regulation Bureau (RB)' },
                { value: 'PGRC', label: 'PGRC' },
                { value: 'APPROVAL_BUREAU', label: 'Approval Bureau' },
                { value: 'REGIONAL_OFFICE', label: 'Regional Office' },
              ]}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UserManagementPage;
