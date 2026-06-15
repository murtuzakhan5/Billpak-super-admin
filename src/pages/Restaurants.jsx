import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewRestaurant, setRenewRestaurant] = useState(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    ownerName: '',
    planId: '',
    expiryDate: '',
  });

  const [renewForm, setRenewForm] = useState({
    planId: '',
    months: 1,
    paymentStatus: true,
    transactionId: '',
  });

  const { token } = useAuth();
  // const API_URL = '/api';
  const API_URL = 'https://billpak.runasp.net/api';

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    loadData();
  }, []);

  const toDateInputValue = (dateValue) => {
    if (!dateValue) return '';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0];
  };

  const setDefaultExpiry = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    return expiry < today;
  };

  const loadData = async () => {
    setLoading(true);

    try {
      const [restaurantsRes, plansRes] = await Promise.all([
        axios.get(`${API_URL}/SuperAdmin/restaurants`, { headers }),
        axios.get(`${API_URL}/SuperAdmin/plans/active`, { headers }),
      ]);

      setRestaurants(restaurantsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (error) {
      console.error('Load data error:', error.response?.data || error);
      toast.error('Failed to load restaurants/plans');
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      const response = await axios.get(`${API_URL}/SuperAdmin/restaurants`, {
        headers,
      });

      setRestaurants(response.data || []);
    } catch (error) {
      console.error('Load restaurants error:', error.response?.data || error);
      toast.error('Failed to load restaurants');
    }
  };

  const getPlanName = (restaurant) => {
    if (restaurant.planName) return restaurant.planName;

    const matchedPlan = plans.find(
      (plan) => Number(plan.id) === Number(restaurant.planId)
    );

    return matchedPlan ? matchedPlan.name : 'Unknown';
  };

  const getStatusBadge = (restaurant) => {
    if (!restaurant.isActive) {
      return {
        label: 'Inactive',
        className: 'bg-red-100 text-red-800',
      };
    }

    if (isExpired(restaurant.expiryDate)) {
      return {
        label: 'Expired',
        className: 'bg-yellow-100 text-yellow-800',
      };
    }

    return {
      label: 'Active',
      className: 'bg-green-100 text-green-800',
    };
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      ownerName: '',
      planId: plans.length > 0 ? plans[0].id : '',
      expiryDate: '',
    });

    setEditingRestaurant(null);
  };

  const openAddModal = () => {
    if (plans.length === 0) {
      toast.error('Please create an active plan first');
      return;
    }

    setEditingRestaurant(null);

    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      ownerName: '',
      planId: plans[0].id,
      expiryDate: setDefaultExpiry(),
    });

    setShowModal(true);
  };

  const openEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);

    setFormData({
      name: restaurant.name || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      address: restaurant.address || '',
      ownerName: restaurant.ownerName || '',
      planId: restaurant.planId || (plans.length > 0 ? plans[0].id : ''),
      expiryDate: toDateInputValue(restaurant.expiryDate),
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and phone are required');
      setSubmitting(false);
      return;
    }

    if (!formData.planId) {
      toast.error('Please select a plan');
      setSubmitting(false);
      return;
    }

    if (!formData.expiryDate) {
      toast.error('Expiry date is required');
      setSubmitting(false);
      return;
    }

    const apiData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || `${formData.phone.trim()}@restaurant.com`,
      address: formData.address.trim() || 'Not provided',
      ownerName: formData.ownerName.trim() || formData.name.trim(),
      planId: Number(formData.planId),
      expiryDate: new Date(formData.expiryDate).toISOString(),
    };

    try {
      if (editingRestaurant) {
        await axios.put(
          `${API_URL}/SuperAdmin/restaurants/${editingRestaurant.id}`,
          apiData,
          { headers }
        );

        toast.success('Restaurant updated successfully!');
      } else {
        await axios.post(`${API_URL}/SuperAdmin/restaurants`, apiData, {
          headers,
        });

        toast.success('Restaurant added successfully!');
      }

      setShowModal(false);
      resetForm();
      await loadRestaurants();
    } catch (error) {
      console.error('Submit restaurant error:', error.response?.data || error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        'Failed to save restaurant';

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/SuperAdmin/restaurants/${id}/status`,
        { isActive: !currentStatus },
        { headers }
      );

      toast.success(
        `Restaurant ${!currentStatus ? 'activated' : 'deactivated'}`
      );

      await loadRestaurants();
    } catch (error) {
      console.error('Status error:', error.response?.data || error);
      toast.error('Failed to update status');
    }
  };

  const openRenewModal = (restaurant) => {
    if (plans.length === 0) {
      toast.error('Please create an active plan first');
      return;
    }

    setRenewRestaurant(restaurant);

    setRenewForm({
      planId: restaurant.planId || plans[0].id,
      months: 1,
      paymentStatus: true,
      transactionId: '',
    });

    setShowRenewModal(true);
  };

  const closeRenewModal = () => {
    if (renewSubmitting) return;

    setShowRenewModal(false);
    setRenewRestaurant(null);

    setRenewForm({
      planId: '',
      months: 1,
      paymentStatus: true,
      transactionId: '',
    });
  };

  const submitRenew = async (e) => {
    e.preventDefault();

    if (!renewRestaurant) return;

    if (!renewForm.planId) {
      toast.error('Please select a plan');
      return;
    }

    if (!renewForm.months || Number(renewForm.months) <= 0) {
      toast.error('Months must be greater than 0');
      return;
    }

    setRenewSubmitting(true);

    try {
      await axios.patch(
        `${API_URL}/SuperAdmin/restaurants/${renewRestaurant.id}/renew`,
        {
          planId: Number(renewForm.planId),
          months: Number(renewForm.months),
          paymentStatus: Boolean(renewForm.paymentStatus),
          transactionId: renewForm.transactionId.trim() || null,
        },
        { headers }
      );

      toast.success('Subscription renewed successfully!');
      closeRenewModal();
      await loadRestaurants();
    } catch (error) {
      console.error('Renew error:', error.response?.data || error);

      toast.error(
        error.response?.data?.message || 'Failed to renew subscription'
      );
    } finally {
      setRenewSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Restaurants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage restaurants, plans, expiry dates and subscription renewals.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Restaurant
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : restaurants.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No restaurants found
                </td>
              </tr>
            ) : (
              restaurants.map((restaurant) => {
                const status = getStatusBadge(restaurant);

                return (
                  <tr key={restaurant.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">
                        {restaurant.ownerName}
                      </div>
                    </td>

                    <td className="px-6 py-4">{restaurant.phone}</td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {getPlanName(restaurant)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {restaurant.expiryDate
                        ? new Date(restaurant.expiryDate).toLocaleDateString()
                        : 'N/A'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() =>
                            toggleStatus(restaurant.id, restaurant.isActive)
                          }
                          className={`text-sm ${
                            restaurant.isActive
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {restaurant.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => openRenewModal(restaurant)}
                          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Renew
                        </button>

                        <button
                          onClick={() => openEditModal(restaurant)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Name *
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="KFC, Pizza Hut, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Admin Login) *
                  </label>

                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="03001234567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="info@restaurant.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>

                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Main Boulevard, Lahore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name
                  </label>

                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ali Khan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan *
                  </label>

                  <select
                    value={formData.planId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        planId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (Rs{' '}
                        {Number(plan.price || 0).toLocaleString()}/month)
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-gray-400 mt-1">
                    Plan change karne se restaurant ke allowed modules update
                    ho jayenge.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>

                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    Expiry date ke baad restaurant app access block ho jayega.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? 'Saving...'
                    : editingRestaurant
                    ? 'Update Restaurant'
                    : 'Add Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRenewModal && renewRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-1">Renew Subscription</h2>

            <p className="text-sm text-gray-500 mb-4">
              {renewRestaurant.name} — current expiry:{' '}
              {renewRestaurant.expiryDate
                ? new Date(renewRestaurant.expiryDate).toLocaleDateString()
                : 'N/A'}
            </p>

            <form onSubmit={submitRenew}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan *
                  </label>

                  <select
                    value={renewForm.planId}
                    onChange={(e) =>
                      setRenewForm({
                        ...renewForm,
                        planId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} (Rs{' '}
                        {Number(plan.price || 0).toLocaleString()}/month)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Months *
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={renewForm.months}
                    onChange={(e) =>
                      setRenewForm({
                        ...renewForm,
                        months: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="paymentStatus"
                    type="checkbox"
                    checked={renewForm.paymentStatus}
                    onChange={(e) =>
                      setRenewForm({
                        ...renewForm,
                        paymentStatus: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />

                  <label
                    htmlFor="paymentStatus"
                    className="text-sm font-medium text-gray-700"
                  >
                    Payment received
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>

                  <input
                    type="text"
                    value={renewForm.transactionId}
                    onChange={(e) =>
                      setRenewForm({
                        ...renewForm,
                        transactionId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeRenewModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={renewSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={renewSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  {renewSubmitting ? 'Renewing...' : 'Renew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}