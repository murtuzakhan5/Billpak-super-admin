import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function Modules() {
  const { token } = useAuth();
  const API_URL = '/api';

  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
  });

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const result = modules.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.key?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );

    setFilteredModules(result);
  }, [search, modules]);

  const loadModules = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/SuperAdmin/modules`, {
        headers,
      });

      setModules(res.data || []);
      setFilteredModules(res.data || []);
    } catch (error) {
      console.error('Load modules error:', error.response?.data || error);
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingModule(null);

    setFormData({
      key: '',
      name: '',
      description: '',
    });

    setShowModal(true);
  };

  const openEditModal = (module) => {
    setEditingModule(module);

    setFormData({
      key: module.key || '',
      name: module.name || '',
      description: module.description || '',
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setEditingModule(null);

    setFormData({
      key: '',
      name: '',
      description: '',
    });
  };

  const submitModule = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Module name required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingModule) {
        await axios.put(
          `${API_URL}/SuperAdmin/modules/${editingModule.id}`,
          {
            name: formData.name.trim(),
            description: formData.description.trim(),
          },
          { headers }
        );

        toast.success('Module updated successfully');
      } else {
        await axios.post(
          `${API_URL}/SuperAdmin/modules`,
          {
            key: formData.key.trim() || formData.name.trim(),
            name: formData.name.trim(),
            description: formData.description.trim(),
          },
          { headers }
        );

        toast.success('Module added successfully');
      }

      closeModal();
      await loadModules();
    } catch (error) {
      console.error('Submit module error:', error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          (editingModule ? 'Failed to update module' : 'Failed to create module')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleModuleStatus = async (module) => {
    try {
      await axios.patch(
        `${API_URL}/SuperAdmin/modules/${module.id}/status`,
        {
          isActive: !module.isActive,
        },
        { headers }
      );

      toast.success(
        `Module ${!module.isActive ? 'activated' : 'deactivated'} successfully`
      );

      await loadModules();
    } catch (error) {
      console.error('Toggle module status error:', error.response?.data || error);

      toast.error(
        error.response?.data?.message || 'Failed to update module status'
      );
    }
  };

  const deleteModule = async (module) => {
    const ok = window.confirm(
      `Delete "${module.name}"?\n\nAgar ye module kisi plan ya user permission mein use ho raha hai to system isay hard delete nahi karega, sirf deactivate karega.`
    );

    if (!ok) return;

    try {
      await axios.delete(`${API_URL}/SuperAdmin/modules/${module.id}`, {
        headers,
      });

      toast.success('Module deleted/deactivated successfully');
      await loadModules();
    } catch (error) {
      console.error('Delete module error:', error.response?.data || error);

      toast.error(error.response?.data?.message || 'Failed to delete module');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, edit and manage SaaS modules for your plans.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Module
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Loading modules...</div>
        ) : filteredModules.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-lg font-bold text-gray-800">
              No modules found
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Click Add Module to create your first SaaS module.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Module
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Key
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
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
              {filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {module.name}
                    </div>

                    <div className="text-xs text-gray-400">
                      ID: {module.id}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                      {module.key}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {module.description || 'No description'}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        module.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {module.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openEditModal(module)}
                        className="inline-flex items-center px-3 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>

                      <button
                        onClick={() => toggleModuleStatus(module)}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          module.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {module.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => deleteModule(module)}
                        className="inline-flex items-center px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingModule ? 'Edit Module' : 'Add New Module'}
            </h2>

            <form onSubmit={submitModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Name *
                </label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Urdu Invoice"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Key
                </label>

                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  disabled={Boolean(editingModule)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    editingModule ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="urdu_invoice"
                />

                <p className="text-xs text-gray-400 mt-1">
                  {editingModule
                    ? 'Key live system mein use hoti hai, is liye edit mode mein lock hai.'
                    : 'Empty choro to name se auto key ban jayegi.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Bilingual Urdu English invoice"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {submitting
                    ? 'Saving...'
                    : editingModule
                    ? 'Update Module'
                    : 'Add Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}