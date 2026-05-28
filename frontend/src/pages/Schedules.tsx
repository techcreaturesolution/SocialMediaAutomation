import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { scheduleAPI } from '../services/api';
import { Schedule } from '../types';
import { Calendar, XCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const statusIcons: Record<string, React.FC<{ className?: string }>> = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle,
  failed: AlertCircle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400',
  processing: 'text-blue-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
  cancelled: 'text-gray-400',
};

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const res = await scheduleAPI.getAll();
      setSchedules(res.data.schedules);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const handleCancel = async (id: string) => {
    try {
      await scheduleAPI.cancel(id);
      toast.success('Schedule cancelled');
      fetchSchedules();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-400" />
          Scheduled Content
        </h1>
        <p className="text-slate-400">Manage your content publishing schedule</p>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No scheduled content yet.</p>
          <Link to="/generate" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">Generate & schedule content</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const Icon = statusIcons[schedule.status] || Clock;
            const color = statusColors[schedule.status] || 'text-gray-400';
            const content = typeof schedule.contentId === 'object' ? schedule.contentId : null;

            return (
              <div key={schedule._id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <div>
                      <p className="text-white font-medium">
                        {content ? (
                          <Link to={`/content/${content._id}`} className="hover:text-blue-400">
                            {content.title}
                          </Link>
                        ) : (
                          'Content'
                        )}
                      </p>
                      <p className="text-sm text-slate-400">
                        Scheduled: {new Date(schedule.scheduledAt).toLocaleString()} ({schedule.timezone})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {schedule.platforms.map((p) => (
                        <span key={p} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs capitalize">{p}</span>
                      ))}
                    </div>
                    {schedule.recurring && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Recurring</span>}
                    <span className={`px-2 py-0.5 rounded text-xs capitalize ${color}`}>{schedule.status}</span>
                    {schedule.status === 'pending' && (
                      <button onClick={() => handleCancel(schedule._id)} className="text-red-400 hover:text-red-300 text-sm">Cancel</button>
                    )}
                  </div>
                </div>

                {schedule.results && schedule.results.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
                    {schedule.results.map((r, i) => (
                      <span key={i} className={`px-2 py-1 rounded text-xs ${r.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {r.platform}: {r.success ? 'Published' : r.error}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Schedules;
