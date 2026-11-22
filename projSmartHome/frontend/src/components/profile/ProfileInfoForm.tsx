import { ROLES } from '../../types/role';
import type { Role } from '../../types/role';

interface Props {
  displayName: string;
  email: string;
  accessLevel: string;
  role?: Role;
  onDisplayNameChange: (v: string) => void;
  onAccessLevelChange: (v: string) => void;
}

export default function ProfileInfoForm({ displayName, email, accessLevel, role, onDisplayNameChange, onAccessLevelChange }: Props) {
  return (
    <section className="bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-6">
      <h4 className="text-lg font-bold mb-8 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">badge</span>
        Profile Information
      </h4>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase px-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => onDisplayNameChange(e.target.value)}
              className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-primary dark:focus:ring-primary/30 focus:ring-1 text-slate-900 dark:text-white font-medium transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase px-1">Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-400 dark:text-slate-500 font-medium cursor-not-allowed"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase px-1">Access Level</label>
          <select
            value={accessLevel}
            onChange={e => onAccessLevelChange(e.target.value)}
            disabled={role !== ROLES.ADMIN}
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:border-primary focus:ring-primary dark:focus:ring-primary/30 focus:ring-1 text-slate-900 dark:text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option>Administrator (Full System Control)</option>
            <option>Guest (Temporary Limited Access)</option>
            <option>Restricted (Limited Access)</option>
          </select>
          {role !== ROLES.ADMIN && (
            <p className="text-xs text-slate-400 dark:text-slate-500 px-1">Only admins can change access levels.</p>
          )}
        </div>
      </div>
    </section>
  );
}
