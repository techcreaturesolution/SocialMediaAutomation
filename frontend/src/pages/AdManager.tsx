import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { Content } from '../types';
import { Megaphone, TrendingUp, DollarSign, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdManager: React.FC = () => {
  const [ads, setAds] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentAPI.getAll({ limit: 50 })
      .then((res) => {
        const adContent = res.data.contents.filter((c: Content) => c.isAd);
        setAds(adContent);
      })
      .catch(() => toast.error('Failed to load ads'))
      .finally(() => setLoading(false));
  }, []);

  const totalBudget = ads.reduce((sum, ad) => sum + (ad.adSettings?.budget || 0), 0);
  const activeAds = ads.filter((ad) => ad.status === 'published').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-orange-400" />
            Ad Manager
          </h1>
          <p className="text-slate-400">Create and manage advertising campaigns</p>
        </div>
        <Link to="/generate?ad=true" className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm">
          + Create Ad Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg"><Megaphone className="w-5 h-5 text-orange-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Total Campaigns</p>
              <p className="text-2xl font-bold text-white">{ads.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Active Ads</p>
              <p className="text-2xl font-bold text-white">{activeAds}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-sm text-slate-400">Total Daily Budget</p>
              <p className="text-2xl font-bold text-white">INR {totalBudget}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Campaigns */}
      {ads.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <Megaphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No ad campaigns yet</p>
          <p className="text-sm text-slate-500">Generate content with the "Generate as Ad" option enabled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <Link key={ad._id} to={`/content/${ad._id}`} className="block bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-orange-500/30 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-medium group-hover:text-orange-400">{ad.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      ad.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      ad.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{ad.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    {ad.adSettings && (
                      <>
                        <span className="capitalize">{ad.adSettings.objective}</span>
                        <span>{ad.adSettings.currency} {ad.adSettings.budget}/day</span>
                        <span>{ad.adSettings.duration} days</span>
                        {ad.adSettings.targetAudience && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ad.adSettings.targetAudience}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdManager;
