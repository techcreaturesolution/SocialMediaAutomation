import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { Content } from '../types';
import { Send, Trash2, ArrowLeft, ExternalLink, Copy, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const platformColors: Record<string, string> = {
  facebook: 'border-blue-600 bg-blue-600/10',
  instagram: 'border-pink-600 bg-pink-600/10',
  twitter: 'border-sky-500 bg-sky-500/10',
  linkedin: 'border-blue-700 bg-blue-700/10',
  youtube: 'border-red-600 bg-red-600/10',
};

const ContentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;
    contentAPI.getById(id)
      .then((res) => setContent(res.data.content))
      .catch(() => toast.error('Content not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePublish = async (platforms?: string[]) => {
    if (!content) return;
    setPublishing(true);
    try {
      const res = await contentAPI.publish(content._id, platforms);
      toast.success('Publishing completed!');
      setContent((prev) => prev ? { ...prev, ...res.data.content } : null);
    } catch {
      toast.error('Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!content || !confirm('Delete this content?')) return;
    try {
      await contentAPI.delete(content._id);
      toast.success('Content deleted');
      navigate('/content');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;
  if (!content) return <div className="text-center py-16 text-slate-400">Content not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{content.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              content.status === 'published' ? 'bg-green-500/20 text-green-400' :
              content.status === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>{content.status}</span>
            <span className="text-sm text-slate-400 capitalize">{content.contentType}</span>
            <span className="text-sm text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3" />{content.language}</span>
            {content.isAd && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">Ad Campaign</span>}
          </div>
        </div>

        <div className="flex gap-2">
          {(content.status === 'ready' || content.status === 'failed') && (
            <button onClick={() => handlePublish()} disabled={publishing} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50">
              <Send className="w-4 h-4" /> {publishing ? 'Publishing...' : 'Publish All'}
            </button>
          )}
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Generated Text */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Generated Content</h2>
          <button onClick={() => copyText(content.generatedText)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
        <p className="text-slate-300 whitespace-pre-wrap">{content.generatedText}</p>

        {content.hashtags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-400">Hashtags</p>
              <button onClick={() => copyText(content.hashtags.join(' '))} className="text-xs text-slate-400 hover:text-white">Copy all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {content.hashtags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-sm">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Media */}
      {content.mediaUrls.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-3">Media</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.mediaUrls.map((url, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-slate-700">
                {content.contentType === 'video' || content.contentType === 'reel' ? (
                  <video src={url} controls className="w-full" />
                ) : (
                  <img src={url} alt="" className="w-full" />
                )}
              </div>
            ))}
          </div>
          {content.branding.watermarked && (
            <p className="text-xs text-green-400 mt-2">Company branding applied</p>
          )}
        </div>
      )}

      {/* Platform Variants */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">Platform Variants</h2>
        <div className="space-y-4">
          {content.platformVariants.map((variant, i) => (
            <div key={i} className={`p-4 rounded-lg border ${platformColors[variant.platform] || 'border-slate-600'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white capitalize">{variant.platform}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    variant.status === 'published' ? 'bg-green-500/20 text-green-400' :
                    variant.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-600 text-slate-400'
                  }`}>{variant.status}</span>
                  {variant.postUrl && (
                    <a href={variant.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-300 line-clamp-3">{variant.text}</p>
              {variant.error && <p className="text-xs text-red-400 mt-1">{variant.error}</p>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => copyText(variant.text)} className="text-xs text-slate-400 hover:text-white">Copy text</button>
                {variant.status === 'pending' && (
                  <button onClick={() => handlePublish([variant.platform])} className="text-xs text-green-400 hover:text-green-300">Publish</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Settings */}
      {content.isAd && content.adSettings && (
        <div className="bg-slate-800 rounded-xl p-6 border border-orange-500/30">
          <h2 className="text-lg font-semibold text-orange-400 mb-4">Ad Campaign Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-400">Objective</p><p className="text-white capitalize">{content.adSettings.objective}</p></div>
            <div><p className="text-slate-400">Budget</p><p className="text-white">{content.adSettings.currency} {content.adSettings.budget}/day</p></div>
            <div><p className="text-slate-400">Duration</p><p className="text-white">{content.adSettings.duration} days</p></div>
            <div><p className="text-slate-400">Audience</p><p className="text-white">{content.adSettings.targetAudience || 'N/A'}</p></div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-3">Generation Info</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-slate-400">AI Model</p><p className="text-white">{content.metadata?.aiModel || 'GPT-4o'}</p></div>
          <div><p className="text-slate-400">Generation Time</p><p className="text-white">{content.metadata?.generationTime ? `${(content.metadata.generationTime / 1000).toFixed(1)}s` : 'N/A'}</p></div>
          <div><p className="text-slate-400">Created</p><p className="text-white">{new Date(content.createdAt).toLocaleString()}</p></div>
          <div><p className="text-slate-400">Language</p><p className="text-white uppercase">{content.language}</p></div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;
