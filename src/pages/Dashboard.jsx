import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BuildingStorefrontIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    revenue: 0,
    expiring: 0,
  });

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth();

  const API_URL = '/api';
  // const API_URL = 'https://billpak.runasp.net/api';
  // const API_URL = 'https://localhost:7246/api';

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const [statsRes, restaurantsRes] = await Promise.all([
        axios.get(`${API_URL}/SuperAdmin/stats`, { headers }),
        axios.get(`${API_URL}/SuperAdmin/restaurants`, { headers }),
      ]);

      setStats({
        total: statsRes.data?.total || 0,
        active: statsRes.data?.active || 0,
        expired: statsRes.data?.expired || 0,
        revenue: statsRes.data?.revenue || 0,
        expiring: statsRes.data?.expiring || 0,
      });

      setRestaurants(restaurantsRes.data || []);
    } catch (error) {
      console.error('Dashboard load error:', error.response?.data || error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString();
  };

  const daysUntil = (dateValue) => {
    if (!dateValue) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(dateValue);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isExpired = (dateValue) => {
    const days = daysUntil(dateValue);
    return days !== null && days < 0;
  };

  const getRestaurantStatus = (restaurant) => {
    if (!restaurant.isActive) {
      return {
        label: 'Inactive',
        className: 'bg-red-100 text-red-700',
      };
    }

    if (isExpired(restaurant.expiryDate)) {
      return {
        label: 'Expired',
        className: 'bg-yellow-100 text-yellow-700',
      };
    }

    return {
      label: 'Active',
      className: 'bg-green-100 text-green-700',
    };
  };

  const getExpiringRestaurants = () => {
    return restaurants
      .filter((restaurant) => {
        const days = daysUntil(restaurant.expiryDate);
        return restaurant.isActive && days !== null && days >= 0 && days <= 7;
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .slice(0, 6);
  };

  const getRecentRestaurants = () => {
    return [...restaurants]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);
  };

  const getPlanDistribution = () => {
    const grouped = {};

    restaurants.forEach((restaurant) => {
      const planName = restaurant.planName || 'No Plan';
      grouped[planName] = (grouped[planName] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([name, count]) => ({
        name,
        count,
        percent:
          restaurants.length > 0
            ? Math.round((count / restaurants.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const totalRestaurants = Number(stats.total || 0);
  const activeRestaurants = Number(stats.active || 0);
  const expiredRestaurants = Number(stats.expired || 0);
  const expiringRestaurants = Number(stats.expiring || 0);

  const activePercent =
    totalRestaurants > 0
      ? Math.round((activeRestaurants / totalRestaurants) * 100)
      : 0;

  const expiredPercent =
    totalRestaurants > 0
      ? Math.round((expiredRestaurants / totalRestaurants) * 100)
      : 0;

  const statsCards = [
    {
      title: 'Total Restaurants',
      value: totalRestaurants,
      subtitle: 'All registered restaurants',
      icon: BuildingStorefrontIcon,
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    {
      title: 'Active Subscriptions',
      value: activeRestaurants,
      subtitle: `${activePercent}% of total restaurants`,
      icon: UserGroupIcon,
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.revenue),
      subtitle: 'Paid renewals this month',
      icon: CurrencyRupeeIcon,
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    {
      title: 'Expiring Soon',
      value: expiringRestaurants,
      subtitle: 'Subscriptions ending in 7 days',
      icon: ClockIcon,
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
  ];

  const expiringList = getExpiringRestaurants();
  const recentList = getRecentRestaurants();
  const planDistribution = getPlanDistribution();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor restaurants, subscriptions, expiry status and monthly revenue.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition w-fit"
        >
          Refresh Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl shadow-sm border ${card.border} p-6`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  {card.title}
                </p>

                <p className="text-3xl font-bold mt-2 text-gray-900">
                  {card.value}
                </p>

                <p className="text-xs text-gray-400 mt-2">{card.subtitle}</p>
              </div>

              <div className={`${card.bg} p-3 rounded-xl`}>
                <card.icon className={`h-7 w-7 ${card.text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Subscription Overview
              </h2>
              <p className="text-sm text-gray-500">
                Active, expired and expiring subscription health.
              </p>
            </div>

            <ChartBarIcon className="h-7 w-7 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Active</p>
              </div>
              <p className="text-2xl font-bold text-green-800 mt-2">
                {activeRestaurants}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-700">
                  Expiring
                </p>
              </div>
              <p className="text-2xl font-bold text-yellow-800 mt-2">
                {expiringRestaurants}
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <p className="text-sm font-semibold text-red-700">Expired</p>
              </div>
              <p className="text-2xl font-bold text-red-800 mt-2">
                {expiredRestaurants}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active Ratio</span>
                <span className="font-semibold text-gray-900">
                  {activePercent}%
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${activePercent}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Expired Ratio</span>
                <span className="font-semibold text-gray-900">
                  {expiredPercent}%
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{ width: `${expiredPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Monthly Revenue
              </h2>
              <p className="text-sm text-gray-500">Current month paid renewals</p>
            </div>

            <ArrowTrendingUpIcon className="h-7 w-7 text-purple-500" />
          </div>

          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
            <p className="text-sm text-purple-700 font-semibold">
              Revenue This Month
            </p>

            <p className="text-4xl font-bold text-purple-900 mt-3">
              {formatCurrency(stats.revenue)}
            </p>

            <p className="text-xs text-purple-600 mt-3">
              Revenue is calculated from paid restaurant subscription renewals.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active subscriptions</span>
              <span className="font-semibold text-gray-900">
                {activeRestaurants}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expired subscriptions</span>
              <span className="font-semibold text-gray-900">
                {expiredRestaurants}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Expiring soon</span>
              <span className="font-semibold text-gray-900">
                {expiringRestaurants}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Plan Distribution
              </h2>
              <p className="text-sm text-gray-500">
                Restaurants grouped by plan.
              </p>
            </div>

            <BuildingStorefrontIcon className="h-7 w-7 text-gray-400" />
          </div>

          {planDistribution.length === 0 ? (
            <p className="text-sm text-gray-500">No plan data available.</p>
          ) : (
            <div className="space-y-4">
              {planDistribution.map((plan) => (
                <div key={plan.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700">
                      {plan.name}
                    </span>

                    <span className="text-gray-500">
                      {plan.count} restaurant{plan.count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ width: `${plan.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Expiring Soon
              </h2>
              <p className="text-sm text-gray-500">
                Restaurants with subscription ending within 7 days.
              </p>
            </div>

            <CalendarDaysIcon className="h-7 w-7 text-orange-500" />
          </div>

          {expiringList.length === 0 ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-5">
              <p className="text-green-700 font-semibold">
                No subscriptions expiring soon.
              </p>
              <p className="text-sm text-green-600 mt-1">
                Everything looks good for the next 7 days.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Restaurant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Days Left
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {expiringList.map((restaurant) => {
                    const days = daysUntil(restaurant.expiryDate);

                    return (
                      <tr key={restaurant.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">
                            {restaurant.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {restaurant.phone}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {restaurant.planName || 'No Plan'}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(restaurant.expiryDate)}
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-700">
                            {days} day{days === 1 ? '' : 's'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Restaurants
            </h2>
            <p className="text-sm text-gray-500">
              Latest restaurants added to the system.
            </p>
          </div>

          <BuildingStorefrontIcon className="h-7 w-7 text-gray-400" />
        </div>

        {recentList.length === 0 ? (
          <p className="text-sm text-gray-500">No restaurants found.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Restaurant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Expiry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {recentList.map((restaurant) => {
                  const status = getRestaurantStatus(restaurant);

                  return (
                    <tr key={restaurant.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          {restaurant.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {restaurant.phone}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {restaurant.ownerName || 'N/A'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {restaurant.planName || 'No Plan'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(restaurant.expiryDate)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}