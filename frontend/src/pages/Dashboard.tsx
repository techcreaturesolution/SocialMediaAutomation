import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { DashboardStats, TrendingTopic } from '../types';
import { BarChart3, FileText, Calendar, AlertCircle, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-pink-600',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-600',
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      contentAPI.getDashboard().then((res) => setStats(res.data)),
      contentAPI.getTrending().then((res) => setTrending(res.data.topics || [])).catch(() => {}),
    ])
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Content', value: stats?.stats.totalContent || 0, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Published', value: stats?.stats.published || 0, icon: BarChart3, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Scheduled', value: stats?.stats.scheduled || 0, icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Failed', value: stats?.stats.failed || 0, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">AI-Powered Content Automation Overview</p>
        </div>
        <Link to="/generate" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Sparkles className="w-4 h-4" />
          Generate Content
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Stats */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Platform Performance</h2>
          {stats?.platformStats && stats.platformStats.length > 0 ? (
            <div className="space-y-3">
              {stats.platformStats.map((p) => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${platformColors[p._id] || 'bg-gray-500'}`} />
                  <span className="text-sm text-slate-300 capitalize w-24">{p._id}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${platformColors[p._id] || 'bg-gray-500'}`}
                      style={{ width: `${p.total > 0 ? (p.published / p.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400">{p.published}/{p.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No platform data yet. Generate and publish content to see stats.</p>
          )}
        </div>

        {/* Trending Topics */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Trending Tech Topics</h2>
          </div>
          {trending.length > 0 ? (
            <div className="space-y-3">
              {trending.slice(0, 5).map((topic, i) => (
                <Link
                  key={i}
                  to={`/generate?topic=${encodeURIComponent(topic.title)}`}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{topic.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{topic.description?.substring(0, 80)}...</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Connect your API keys to see AI-generated trending topics.</p>
          )}
        </div>
      </div>

      {/* Recent Content */}
      {stats?.recentContent && stats.recentContent.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Content</h2>
            <Link to="/content" className="text-sm text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 px-3">Title</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentContent.map((content) => (
                  <tr key={content._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2.5 px-3">
                      <Link to={`/content/${content._id}`} className="text-white hover:text-blue-400">
                        {content.title}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-400">{content.contentType}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        content.status === 'published' ? 'bg-green-500/20 text-green-400' :
                        content.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                        content.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {content.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(content.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
