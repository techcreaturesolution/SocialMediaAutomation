import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { Language } from '../types';
import { Sparkles, Image, Video, FileText, Type, Film, Camera, Send, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const contentTypes = [
  { value: 'text', label: 'Text Post', icon: Type, desc: 'Text-only social media post' },
  { value: 'image', label: 'Image Post', icon: Image, desc: 'AI-generated image with caption' },
  { value: 'video', label: 'Video', icon: Video, desc: 'AI-generated video from text' },
  { value: 'reel', label: 'Reel/Short', icon: Film, desc: 'Vertical short-form video' },
  { value: 'carousel', label: 'Carousel', icon: Camera, desc: 'Multiple image carousel' },
  { value: 'story', label: 'Story', icon: Camera, desc: 'Story format content' },
];

const platforms = [
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' },
  { value: 'twitter', label: 'Twitter/X', color: 'bg-sky-500' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-600' },
];

const tones = ['professional', 'casual', 'humorous', 'educational', 'inspirational'];

const GenerateContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    topic: searchParams.get('topic') || '',
    contentType: 'image',
    platforms: ['facebook', 'instagram', 'twitter', 'linkedin'],
    language: 'en',
    tone: 'professional',
    includeHashtags: true,
    includeBranding: true,
    scheduleAt: '',
    isAd: false,
    adObjective: 'awareness',
    adBudget: 500,
    adAudience: '',
    adDuration: 7,
  });

  useEffect(() => {
    contentAPI.getLanguages()
      .then((res) => setLanguages(res.data.languages))
      .catch(() => {});
  }, []);

  const togglePlatform = (platform: string) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleGenerate = async () => {
    if (!form.topic.trim()) { toast.error('Please enter a topic'); return; }
    if (form.platforms.length === 0) { toast.error('Select at least one platform'); return; }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        topic: form.topic,
        contentType: form.contentType,
        platforms: form.platforms,
        language: form.language,
        tone: form.tone,
        includeHashtags: form.includeHashtags,
        includeBranding: form.includeBranding,
        isAd: form.isAd,
      };

      if (form.scheduleAt) payload.scheduleAt = form.scheduleAt;
      if (form.isAd) {
        payload.adSettings = {
          objective: form.adObjective,
          budget: form.adBudget,
          targetAudience: form.adAudience,
          duration: form.adDuration,
        };
      }

      const res = await contentAPI.generate(payload as Parameters<typeof contentAPI.generate>[0]);
      toast.success('Content generated successfully!');
      navigate(`/content/${res.data.content.id}`);
    } catch (err) {
      toast.error('Failed to generate content. Check your API keys.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          Generate AI Content
        </h1>
        <p className="text-slate-400 mt-1">Create trending technology content for all your social media platforms</p>
      </div>

      {/* Topic */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-2">Topic / Prompt</label>
        <textarea
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="e.g., Latest AI innovations in 2025, Top 10 programming languages, Quantum computing breakthroughs..."
        />
      </div>

      {/* Content Type */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-3">Content Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setForm({ ...form, contentType: type.value })}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  form.contentType === type.value
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-slate-400">{type.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platforms */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-3">Target Platforms</label>
        <div className="flex flex-wrap gap-3">
          {platforms.map((p) => (
            <button
              key={p.value}
              onClick={() => togglePlatform(p.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                form.platforms.includes(p.value)
                  ? `${p.color} text-white`
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language & Tone */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.length > 0 ? (
                languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))
              ) : (
                <>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                  <option value="ar">Arabic</option>
                  <option value="pt">Portuguese</option>
                  <option value="ko">Korean</option>
                  <option value="ru">Russian</option>
                  <option value="bn">Bengali</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="mr">Marathi</option>
                  <option value="gu">Gujarati</option>
                  <option value="ur">Urdu</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
            <select
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tones.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.includeHashtags} onChange={(e) => setForm({ ...form, includeHashtags: e.target.checked })} className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-slate-300">Include Hashtags</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.includeBranding} onChange={(e) => setForm({ ...form, includeBranding: e.target.checked })} className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-slate-300">Include Company Branding</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isAd} onChange={(e) => setForm({ ...form, isAd: e.target.checked })} className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-slate-300">Generate as Ad</span>
          </label>
        </div>
      </div>

      {/* Ad Settings */}
      {form.isAd && (
        <div className="bg-slate-800 rounded-xl p-6 border border-orange-500/30">
          <h3 className="text-sm font-medium text-orange-400 mb-4">Ad Campaign Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Objective</label>
              <select value={form.adObjective} onChange={(e) => setForm({ ...form, adObjective: e.target.value })} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white">
                <option value="awareness">Brand Awareness</option>
                <option value="traffic">Website Traffic</option>
                <option value="engagement">Engagement</option>
                <option value="leads">Lead Generation</option>
                <option value="conversions">Conversions</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Daily Budget (INR)</label>
              <input type="number" value={form.adBudget} onChange={(e) => setForm({ ...form, adBudget: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Target Audience</label>
              <input type="text" value={form.adAudience} onChange={(e) => setForm({ ...form, adAudience: e.target.value })} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" placeholder="e.g., Tech professionals aged 25-45" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Duration (days)</label>
              <input type="number" value={form.adDuration} onChange={(e) => setForm({ ...form, adDuration: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Schedule */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
          <Clock className="w-4 h-4" /> Schedule (optional)
        </label>
        <input
          type="datetime-local"
          value={form.scheduleAt}
          onChange={(e) => setForm({ ...form, scheduleAt: e.target.value })}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Generate Button */}
      <div className="flex gap-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? 'Generating...' : 'Generate Content'}
        </button>
        {!form.scheduleAt && (
          <button
            onClick={async () => {
              if (!form.topic.trim()) { toast.error('Please enter a topic'); return; }
              setLoading(true);
              try {
                const res = await contentAPI.generate({
                  topic: form.topic,
                  contentType: form.contentType,
                  platforms: form.platforms,
                  language: form.language,
                  tone: form.tone,
                  includeHashtags: form.includeHashtags,
                  includeBranding: form.includeBranding,
                });
                const contentId = res.data.content.id;
                await contentAPI.publish(contentId, form.platforms);
                toast.success('Content generated & published!');
                navigate(`/content/${contentId}`);
              } catch {
                toast.error('Failed to generate & publish');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            Generate & Publish Now
          </button>
        )}
      </div>
    </div>
  );
};

export default GenerateContent;
