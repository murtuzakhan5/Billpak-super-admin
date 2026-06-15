import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Plans() {
  const { token } = useAuth();
  // const API_URL = '/api';
const API_URL = 'https://billpak.runasp.net/api';


  const [plans, setPlans] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planSubmitting, setPlanSubmitting] = useState(false);

  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    features: '',
  });

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [plansRes, modulesRes] = await Promise.all([
        axios.get(`${API_URL}/SuperAdmin/plans`, { headers }),
        axios.get(`${API_URL}/SuperAdmin/modules`, { headers }),
      ]);

      const plansData = plansRes.data || [];
      const modulesData = modulesRes.data || [];

      setPlans(plansData);
      setModules(modulesData);

      if (plansData.length > 0) {
        const activeSelectedPlan =
          selectedPlan && plansData.find((p) => p.id === selectedPlan.id)
            ? plansData.find((p) => p.id === selectedPlan.id)
            : plansData[0];

        await openPlan(activeSelectedPlan);
      } else {
        setSelectedPlan(null);
        setSelectedModules([]);
      }
    } catch (error) {
      console.error('Load plans/modules error:', error.response?.data || error);
      toast.error('Failed to load plans/modules');
    } finally {
      setLoading(false);
    }
  };

  const openPlan = async (plan) => {
    if (!plan) return;

    setSelectedPlan(plan);
    setModulesLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/SuperAdmin/plans/${plan.id}/modules`,
        { headers }
      );

      const enabledIds = (res.data.modules || [])
        .filter((m) => m.isEnabled)
        .map((m) => m.id);

      setSelectedModules(enabledIds);
    } catch (error) {
      console.error('Load plan modules error:', error.response?.data || error);
      toast.error('Failed to load selected plan modules');
      setSelectedModules([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      price: '',
      features: '',
    });
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '',
      price: String(plan.price ?? ''),
      features: plan.features || '',
    });
    setShowPlanModal(true);
  };

  const submitPlan = async (e) => {
    e.preventDefault();

    if (!planForm.name.trim()) {
      toast.error('Plan name required');
      return;
    }

    if (planForm.price === '' || Number(planForm.price) < 0) {
      toast.error('Valid plan price required');
      return;
    }

    setPlanSubmitting(true);

    const payload = {
      name: planForm.name.trim(),
      price: Number(planForm.price),
      features: planForm.features.trim(),
    };

    try {
      if (editingPlan) {
        await axios.put(
          `${API_URL}/SuperAdmin/plans/${editingPlan.id}`,
          payload,
          { headers }
        );

        toast.success('Plan updated successfully');
      } else {
        await axios.post(`${API_URL}/SuperAdmin/plans`, payload, {
          headers,
        });

        toast.success('Plan created successfully');
      }

      setShowPlanModal(false);
      setEditingPlan(null);
      await loadData();
    } catch (error) {
      console.error('Plan submit error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const togglePlanStatus = async (plan) => {
    try {
      await axios.patch(
        `${API_URL}/SuperAdmin/plans/${plan.id}/status`,
        {
          isActive: !plan.isActive,
        },
        { headers }
      );

      toast.success(`Plan ${!plan.isActive ? 'activated' : 'deactivated'}`);
      await loadData();
    } catch (error) {
      console.error('Plan status error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to update plan status');
    }
  };

  const deletePlan = async (plan) => {
    const ok = window.confirm(
      `Delete "${plan.name}"? Agar ye plan kisi restaurant ko assigned hai to delete nahi hoga.`
    );

    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/SuperAdmin/plans/${plan.id}`, {
        headers,
      });

      toast.success('Plan deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Delete plan error:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  const toggleModule = (moduleId) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const savePlanModules = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }

    setSaving(true);

    try {
      await axios.put(
        `${API_URL}/SuperAdmin/plans/${selectedPlan.id}/modules`,
        {
          moduleIds: selectedModules,
        },
        { headers }
      );

      toast.success(`${selectedPlan.name} modules updated successfully`);
      await openPlan(selectedPlan);
      await loadData();
    } catch (error) {
      console.error('Save modules error:', error.response?.data || error);
      toast.error('Failed to update plan modules');
    } finally {
      setSaving(false);
    }
  };

  const getPlanBadgeClass = (planName = '') => {
    const name = planName.toLowerCase();

    if (name.includes('basic')) return 'bg-gray-100 text-gray-700';
    if (name.includes('standard')) return 'bg-blue-100 text-blue-700';
    if (name.includes('premium')) return 'bg-purple-100 text-purple-700';

    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">Loading plans and modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans & Modules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create SaaS plans, write display features, and select modules for each plan.
          </p>
        </div>

        <button
          onClick={openCreatePlanModal}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold text-gray-900 mb-4">Plans</h2>

          {plans.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
              No plans found. Click Add Plan to create Basic, Standard or Premium.
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-xl border transition ${
                    selectedPlan?.id === plan.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => openPlan(plan)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {plan.name}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          Plan ID: {plan.id}
                        </div>

                        <div className="text-sm font-bold text-gray-700 mt-2">
                          Rs. {Number(plan.price || 0).toLocaleString()}
                        </div>

                        <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {plan.features || 'No features written'}
                        </div>
                      </div>

                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          plan.isActive
                            ? getPlanBadgeClass(plan.name)
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
                    <button
                      onClick={() => openEditPlanModal(plan)}
                      className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => togglePlanStatus(plan)}
                      className={`text-xs px-3 py-1 rounded font-semibold ${
                        plan.isActive
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => deletePlan(plan)}
                      className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-700 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow p-5 min-h-[290px]">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPlan ? `${selectedPlan.name} Modules` : 'Select Plan'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Checked modules will show in restaurant app/sidebar.
              </p>
            </div>

            <button
              onClick={savePlanModules}
              disabled={saving || !selectedPlan || modules.length === 0}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {selectedPlan && (
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <div className="text-sm text-gray-500">Features Text</div>
                  <div className="text-sm text-gray-800 mt-1 whitespace-pre-line">
                    {selectedPlan.features || 'No features written'}
                  </div>
                </div>

                <button
                  onClick={() => openEditPlanModal(selectedPlan)}
                  className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold"
                >
                  Edit Features
                </button>
              </div>
            </div>
          )}

          {modulesLoading ? (
            <div className="text-gray-500 bg-gray-50 rounded-lg p-5">
              Loading selected modules...
            </div>
          ) : modules.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h3 className="font-bold text-yellow-800">No modules found</h3>
              <p className="text-sm text-yellow-700 mt-2">
                Pehle Modules page se modules add karo, phir yahan checkbox modules show honge.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Selected:{' '}
                  <span className="font-bold text-gray-900">
                    {selectedModules.length}
                  </span>{' '}
                  / {modules.length}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModules(modules.map((m) => m.id))}
                    className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 font-semibold"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedModules([])}
                    className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {modules.map((module) => {
                  const checked = selectedModules.includes(module.id);

                  return (
                    <label
                      key={module.id}
                      className={`border rounded-xl p-4 cursor-pointer transition ${
                        checked
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModule(module.id)}
                          className="mt-1 h-4 w-4"
                        />

                        <div>
                          <div className="font-semibold text-gray-800">
                            {module.name}
                          </div>

                          <div className="text-xs text-gray-400 mt-1">
                            {module.key}
                          </div>

                          <div className="text-sm text-gray-500 mt-2">
                            {module.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingPlan ? 'Edit Plan' : 'Add New Plan'}
            </h2>

            <form onSubmit={submitPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>

                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Basic, Standard, Premium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Price *
                </label>

                <input
                  type="number"
                  value={planForm.price}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="3000"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features Text
                </label>

                <textarea
                  value={planForm.features}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, features: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Takeaway, Dine In, Products, Sales Report..."
                  rows="5"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Ye text sirf display/pricing ke liye hai. Real access modules checkboxes se control hota hai.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={planSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {planSubmitting
                    ? 'Saving...'
                    : editingPlan
                    ? 'Update Plan'
                    : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}