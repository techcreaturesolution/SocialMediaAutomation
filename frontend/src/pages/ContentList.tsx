import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { Content } from '../types';
import { FileText, Trash2, Send, Image, Video, Type, Film, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  text: Type, image: Image, video: Video, reel: Film, carousel: Camera, story: Camera,
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  generating: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-blue-500/20 text-blue-400',
  scheduled: 'bg-yellow-500/20 text-yellow-400',
  publishing: 'bg-purple-500/20 text-purple-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

const ContentList: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchContents = async () => {
    try {
      const res = await contentAPI.getAll({ status: filter || undefined, page, limit: 20 });
      setContents(res.data.contents);
      setTotalPages(res.data.pagination.pages);
    } catch {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContents(); }, [filter, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content?')) return;
    try {
      await contentAPI.delete(id);
      toast.success('Content deleted');
      fetchContents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await contentAPI.publish(id);
      toast.success('Publishing started!');
      fetchContents();
    } catch {
      toast.error('Failed to publish');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Content</h1>
          <p className="text-slate-400">Manage all your generated content</p>
        </div>
        <Link to="/generate" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
          + New Content
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['', 'ready', 'scheduled', 'published', 'failed'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {contents.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No content found. Start generating!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contents.map((content) => {
            const Icon = typeIcons[content.contentType] || FileText;
            return (
              <div key={content._id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
                {content.thumbnailUrl && (
                  <div className="h-40 bg-slate-700">
                    <img src={content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/content/${content._id}`} className="text-white font-medium hover:text-blue-400 line-clamp-2">
                      {content.title}
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[content.status]}`}>
                      {content.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{content.contentType}</span>
                    <span>•</span>
                    <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                    {content.isAd && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">Ad</span>}
                  </div>

                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{content.generatedText}</p>

                  {content.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {content.hashtags.slice(0, 5).map((tag, i) => (
                        <span key={i} className="text-xs text-blue-400">{tag}</span>
                      ))}
                      {content.hashtags.length > 5 && <span className="text-xs text-slate-500">+{content.hashtags.length - 5} more</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                    {content.status === 'ready' && (
                      <button onClick={() => handlePublish(content._id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-xs hover:bg-green-600/30">
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    )}
                    <button onClick={() => handleDelete(content._id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30 ml-auto">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentList;
