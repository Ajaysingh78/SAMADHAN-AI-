import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, Filter, Plus, ArrowRight, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import AlertBanner from '../../components/common/AlertBanner';

export function InstitutionListPage() {
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    aictePermanentId: '',
    name: '',
    address: '',
    city: '',
    state: '',
    region: 'NORTHERN',
    pinCode: '',
    approvalStatus: 'APPROVED'
  });

  const fetchInstitutions = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (regionFilter) queryParams.append('region', regionFilter);

      const res = await apiClient.get(`/institutions?${queryParams.toString()}`);
      if (res.success) {
        setInstitutions(res.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: `Failed to load institutions: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInstitutions();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, regionFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await apiClient.post('/institutions', formData);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: `Institution '${res.data.name}' registered successfully in AICTE master.`
        });
        setIsModalOpen(false);
        setFormData({
          aictePermanentId: '',
          name: '',
          address: '',
          city: '',
          state: '',
          region: 'NORTHERN',
          pinCode: '',
          approvalStatus: 'APPROVED'
        });
        fetchInstitutions();
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIdentityBadge = (flag) => {
    switch (flag) {
      case 'VERIFIED':
        return <Badge variant="success" size="sm" dot>Verified AICTE ID</Badge>;
      case 'FLAGGED_FOR_REVIEW':
        return <Badge variant="warning" size="sm" dot>Flagged for Review</Badge>;
      case 'MISSING_AICTE_ID':
        return <Badge variant="danger" size="sm" dot>Missing Permanent ID</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Standard</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gov-700">Central Master</span>
            <Badge variant="primary" size="sm">AICTE Registry</Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Technical Institution Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single repository of approved institutions mapped by AICTE Permanent ID for 360° cross-bureau scrutiny.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
        >
          Register Institution
        </Button>
      </div>

      {statusMessage && (
        <AlertBanner variant={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
          {statusMessage.message}
        </AlertBanner>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search by Institution Name, AICTE ID, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leadingIcon={Search}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            options={[
              { value: '', label: 'All AICTE Regions' },
              { value: 'NORTHERN', label: 'Northern Region' },
              { value: 'WESTERN', label: 'Western Region' },
              { value: 'SOUTHERN', label: 'Southern Region' },
              { value: 'EASTERN', label: 'Eastern Region' },
              { value: 'CENTRAL', label: 'Central Region' },
            ]}
          />

          <Button variant="secondary" size="md" onClick={fetchInstitutions} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5 text-left">Technical Institution Name</th>
                <th className="px-6 py-3.5 text-left">AICTE Permanent ID</th>
                <th className="px-6 py-3.5 text-left">Region & Location</th>
                <th className="px-6 py-3.5 text-left">Identity Verification</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gov-600" />
                    <span>Loading institution registry...</span>
                  </td>
                </tr>
              ) : institutions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No institutions found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search criteria or register a new campus.</p>
                  </td>
                </tr>
              ) : (
                institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{inst.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-sm">{inst.address}</div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {inst.aicte_permanent_id ? (
                        <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {inst.aicte_permanent_id}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{inst.city}, {inst.state}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{inst.region} Region</div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {getIdentityBadge(inst.identity_flag)}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      <Link to={`/app/institutions/${inst.id}`}>
                        <Button variant="outline" size="sm" icon={ArrowRight}>
                          360° Dossier
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register Institution Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Technical Institution"
        description="Add a new approved campus to the central registry with AICTE Permanent ID resolution."
      >
        <form onSubmit={handleCreate} className="space-y-3 text-left">
          <Input
            label="AICTE Permanent ID"
            value={formData.aictePermanentId}
            onChange={(e) => setFormData({ ...formData, aictePermanentId: e.target.value })}
            placeholder="e.g. 1-109283741 (Unique)"
            helperText="Leave empty if ID is currently pending verification."
          />

          <Input
            label="Institution Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Skyline Institute of Technology & Research"
            required
          />

          <Input
            label="Campus Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Knowledge Park IV, Sector 12"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Noida"
              required
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="e.g. Uttar Pradesh"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="AICTE Region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              options={[
                { value: 'NORTHERN', label: 'Northern' },
                { value: 'WESTERN', label: 'Western' },
                { value: 'SOUTHERN', label: 'Southern' },
                { value: 'EASTERN', label: 'Eastern' },
                { value: 'CENTRAL', label: 'Central' },
              ]}
              required
            />

            <Input
              label="PIN Code"
              value={formData.pinCode}
              onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
              placeholder="201308"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Campus
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default InstitutionListPage;
