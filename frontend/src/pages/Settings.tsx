import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, metaAPI } from '../services/api';
import { Settings as SettingsIcon, Building2, Globe, Palette, Link2, Check, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface MetaPage {
  pageId: string;
  pageName: string;
  category: string;
  hasInstagram: boolean;
  instagramUsername?: string;
  instagramProfilePicture?: string;
  isSelected: boolean;
}

interface MetaConnectionInfo {
  pages: MetaPage[];
  connected: boolean;
  tokenExpiresAt?: string;
  connectedAt?: string;
}

const socialPlatforms = [
  { key: 'facebook', label: 'Facebook', color: 'bg-blue-600', fields: ['accessToken', 'pageId', 'pageName'] },
  { key: 'instagram', label: 'Instagram', color: 'bg-pink-600', fields: ['accessToken', 'accountId'] },
  { key: 'twitter', label: 'Twitter/X', color: 'bg-sky-500', fields: ['accessToken', 'accessSecret'] },
  { key: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700', fields: ['accessToken', 'organizationId'] },
  { key: 'youtube', label: 'YouTube', color: 'bg-red-600', fields: ['accessToken', 'refreshToken', 'channelId'] },
];

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('branding');
  const [saving, setSaving] = useState(false);

  const [branding, setBranding] = useState({
    name: user?.companyBranding?.name || '',
    logoUrl: user?.companyBranding?.logoUrl || '',
    website: user?.companyBranding?.website || '',
    email: user?.companyBranding?.email || '',
    phone: user?.companyBranding?.phone || '',
    primaryColor: user?.companyBranding?.primaryColor || '#2563eb',
    secondaryColor: user?.companyBranding?.secondaryColor || '#1e40af',
    tagline: user?.companyBranding?.tagline || '',
  });

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [socialCredentials, setSocialCredentials] = useState<Record<string, string>>({});

  const [metaConnection, setMetaConnection] = useState<MetaConnectionInfo | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [selectingPage, setSelectingPage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('meta_success') === 'true') {
      toast.success('Meta Business connected successfully! Facebook & Instagram are now linked.');
      window.history.replaceState({}, '', '/settings');
    } else if (params.get('meta_connected') === 'true') {
      const pageCount = params.get('pages');
      toast.success(`Meta Business connected! ${pageCount} pages found. Please select a page below.`);
      window.history.replaceState({}, '', '/settings');
      setActiveTab('social');
    } else if (params.get('meta_error')) {
      const error = params.get('meta_error');
      toast.error(`Meta Business connection failed: ${error}`);
      window.history.replaceState({}, '', '/settings');
    }
    fetchMetaConnection();
  }, []);

  const fetchMetaConnection = async () => {
    try {
      const res = await metaAPI.getPages();
      setMetaConnection(res.data);
    } catch {
      setMetaConnection(null);
    }
  };

  const connectMeta = async () => {
    setMetaLoading(true);
    try {
      const res = await metaAPI.getLoginUrl();
      window.location.href = res.data.loginUrl;
    } catch {
      toast.error('Failed to initiate Meta Business connection');
      setMetaLoading(false);
    }
  };

  const selectPage = async (pageId: string) => {
    setSelectingPage(true);
    try {
      const res = await metaAPI.selectPage(pageId);
      toast.success(`Page "${res.data.facebook.pageName}" selected! Facebook${res.data.instagram.connected ? ' & Instagram' : ''} connected.`);
      await fetchMetaConnection();
    } catch {
      toast.error('Failed to select page');
    } finally {
      setSelectingPage(false);
    }
  };

  const refreshMetaToken = async () => {
    setMetaLoading(true);
    try {
      await metaAPI.refreshToken();
      toast.success('Meta token refreshed successfully');
      await fetchMetaConnection();
    } catch {
      toast.error('Failed to refresh token');
    } finally {
      setMetaLoading(false);
    }
  };

  const disconnectMeta = async () => {
    if (!confirm('Disconnect Meta Business? This will remove Facebook and Instagram connections.')) return;
    try {
      await metaAPI.disconnect();
      toast.success('Meta Business disconnected');
      setMetaConnection(null);
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const saveBranding = async () => {
    setSaving(true);
    try {
      await updateUser({ companyBranding: branding });
      toast.success('Branding updated!');
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const connectPlatform = async (platform: string) => {
    try {
      await authAPI.connectSocial({ platform, credentials: socialCredentials });
      toast.success(`${platform} connected!`);
      setConnectingPlatform(null);
      setSocialCredentials({});
    } catch {
      toast.error('Failed to connect');
    }
  };

  const disconnectPlatform = async (platform: string) => {
    if (!confirm(`Disconnect ${platform}?`)) return;
    try {
      await authAPI.disconnectSocial(platform);
      toast.success(`${platform} disconnected`);
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const otherPlatforms = socialPlatforms.filter((p) => p.key !== 'facebook' && p.key !== 'instagram');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-400" />
          Settings
        </h1>
        <p className="text-slate-400">Configure your branding and social media connections</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { key: 'branding', label: 'Company Branding', icon: Building2 },
          { key: 'social', label: 'Social Accounts', icon: Link2 },
          { key: 'preferences', label: 'Preferences', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Company Branding</h2>
          </div>
          <p className="text-sm text-slate-400">This information appears on all generated content, images, and videos</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Company Name</label>
              <input value={branding.name} onChange={(e) => setBranding({ ...branding, name: e.target.value })} className={inputClass} placeholder="Tech Creature Solution" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tagline</label>
              <input value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} className={inputClass} placeholder="Your company tagline" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Website</label>
              <input value={branding.website} onChange={(e) => setBranding({ ...branding, website: e.target.value })} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input value={branding.email} onChange={(e) => setBranding({ ...branding, email: e.target.value })} className={inputClass} placeholder="contact@company.com" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Phone</label>
              <input value={branding.phone} onChange={(e) => setBranding({ ...branding, phone: e.target.value })} className={inputClass} placeholder="+91-..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Logo URL</label>
              <input value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} className={inputClass} placeholder="https://...logo.png" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input type="color" value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer bg-transparent border-0" />
                <input value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input type="color" value={branding.secondaryColor} onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer bg-transparent border-0" />
                <input value={branding.secondaryColor} onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>

          <button onClick={saveBranding} disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      )}

      {/* Social Accounts Tab */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          {/* Meta Business Integration */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">M</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Meta Business Suite</h3>
                  <p className="text-sm text-slate-300">Connect Facebook Pages & Instagram Business in one step</p>
                </div>
              </div>
              {metaConnection?.connected && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={refreshMetaToken}
                    disabled={metaLoading}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Refresh Token"
                  >
                    <RefreshCw className={`w-4 h-4 ${metaLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={disconnectMeta}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {!metaConnection?.connected ? (
              <div>
                <p className="text-sm text-slate-300 mb-4">
                  Click below to connect your Meta Business account. This will link your Facebook Page(s) and any 
                  associated Instagram Business account(s) using the official Meta OAuth flow.
                </p>
                <button
                  onClick={connectMeta}
                  disabled={metaLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {metaLoading ? 'Connecting...' : 'Connect with Meta Business'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {metaConnection.connectedAt && (
                  <p className="text-xs text-slate-400">
                    Connected {new Date(metaConnection.connectedAt).toLocaleDateString()}
                    {metaConnection.tokenExpiresAt && ` · Token expires ${new Date(metaConnection.tokenExpiresAt).toLocaleDateString()}`}
                  </p>
                )}

                <div className="grid gap-3">
                  {metaConnection.pages.map((page) => (
                    <div
                      key={page.pageId}
                      className={`p-4 rounded-lg border transition-colors ${
                        page.isSelected
                          ? 'bg-blue-900/40 border-blue-500'
                          : 'bg-slate-800/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">F</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{page.pageName}</p>
                            <p className="text-xs text-slate-400">{page.category} · ID: {page.pageId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {page.hasInstagram && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-pink-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">I</span>
                              </div>
                              <span className="text-sm text-slate-300">@{page.instagramUsername}</span>
                            </div>
                          )}
                          {page.isSelected ? (
                            <span className="flex items-center gap-1 text-sm text-green-400">
                              <Check className="w-4 h-4" /> Active
                            </span>
                          ) : (
                            <button
                              onClick={() => selectPage(page.pageId)}
                              disabled={selectingPage}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs disabled:opacity-50"
                            >
                              {selectingPage ? 'Selecting...' : 'Select'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Other Social Platforms (Twitter, LinkedIn, YouTube) */}
          {otherPlatforms.map((platform) => {
            const isConnected = user?.socialAccounts?.[platform.key];
            return (
              <div key={platform.key} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
                      <span className="text-white text-sm font-bold">{platform.label.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{platform.label}</p>
                      <p className="text-xs text-slate-400">{isConnected ? 'Connected' : 'Not connected'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <Check className="w-5 h-5 text-green-400" />
                        <button onClick={() => disconnectPlatform(platform.key)} className="text-sm text-red-400 hover:text-red-300">Disconnect</button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConnectingPlatform(connectingPlatform === platform.key ? null : platform.key)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {connectingPlatform === platform.key && (
                  <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                    {platform.fields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm text-slate-300 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                          type="password"
                          value={socialCredentials[field] || ''}
                          onChange={(e) => setSocialCredentials({ ...socialCredentials, [field]: e.target.value })}
                          className={inputClass}
                          placeholder={`Enter ${field}`}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button onClick={() => connectPlatform(platform.key)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">Save Connection</button>
                      <button onClick={() => { setConnectingPlatform(null); setSocialCredentials({}); }} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Info about Facebook/Instagram via Meta */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 text-center">
              Facebook and Instagram are connected via Meta Business Suite above. 
              For Twitter/X, LinkedIn, and YouTube, use the manual connection forms.
            </p>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-white">Content Preferences</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Default Language</label>
              <select className={inputClass} defaultValue={user?.preferences?.defaultLanguage || 'en'}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Default Tone</label>
              <select className={inputClass} defaultValue={user?.preferences?.defaultTone || 'professional'}>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
                <option value="educational">Educational</option>
                <option value="inspirational">Inspirational</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked={user?.preferences?.autoPublish} className="w-4 h-4 rounded" />
            <span className="text-sm text-slate-300">Auto-publish generated content immediately</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default Settings;
