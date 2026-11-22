import { useState } from 'react';
import Layout from '../components/layout/Layout';
import ProfileInfoForm from '../components/profile/ProfileInfoForm';
import PinInput from '../components/profile/PinInput';
import TeamAccessSection from '../components/profile/TeamAccessSection';
import ThemeSelector from '../components/profile/ThemeSelector';
import { useProfile } from '../hooks/useProfile';
import { useTeamAccess } from '../hooks/useTeamAccess';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../types/role';
import { roleToAccessLevel, accessLevelToRole } from '../utils/roleUtils';

interface ProfileSettings {
  displayName: string;
  accessLevel: string;
  newPin: string;
}

export default function EditProfile() {
  const profile = useProfile();
  const auth = useAuth();
  const navigate = useNavigate();
  const { apiFetch } = useApi();
  const [theme, setTheme] = useTheme();
  const { showToast } = useToast();
  const email = auth.user?.profile?.email ?? auth.user?.profile?.preferred_username ?? '';

  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>({
    displayName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : '',
    accessLevel: roleToAccessLevel(profile?.role),
    newPin: '',
  });

  const teamAccess = useTeamAccess(profile);

  const handleFieldChange = (field: keyof ProfileSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (field !== 'newPin') setHasChanges(true);
  };

  const handlePinChange = async (pin: string) => {
    setSettings(prev => ({ ...prev, newPin: pin }));
    if (pin.length !== 4 || !profile) return;

    try {
      const res = await apiFetch(`/api/profiles/${profile.profileId}`, {
        method: 'PUT',
        body: JSON.stringify({ accountId: profile.accountId, firstName: profile.firstName, lastName: profile.lastName, role: profile.role, pin }),
      });
      if (res.ok) {
        showToast('PIN saved successfully.', 'success');
        setSettings(prev => ({ ...prev, newPin: '' }));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message ?? 'Failed to save PIN.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaveError(null);

    const parts = settings.displayName.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ');
    const role = accessLevelToRole(settings.accessLevel);

    try {
      const body: Record<string, unknown> = { accountId: profile.accountId, firstName, lastName, role };

      const res = await apiFetch(`/api/profiles/${profile.profileId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.message ?? 'Failed to save profile.');
        return;
      }

      const updated = await res.json();
      const updatedProfile = { ...profile, firstName: updated.firstName, lastName: updated.lastName, role: updated.role };
      sessionStorage.setItem('activeProfile', JSON.stringify(updatedProfile));
      setHasChanges(false);
      showToast('Profile saved successfully.', 'success');
      navigate('/edit-profile', { state: { profile: updatedProfile } });
    } catch {
      setSaveError('Network error. Please try again.');
    }
  };

  const handleDiscard = () => {
    setSettings({
      displayName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : '',
      accessLevel: roleToAccessLevel(profile?.role),
      newPin: '',
    });
    setHasChanges(false);
  };

  return (
    <Layout title="Profile Settings" showSearch={false}>
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-slate-200 dark:border-primary/10">
            <div className="flex -space-x-3">
              <div className="w-14 h-14 rounded-full border-2 border-primary overflow-hidden relative z-10 bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-background-dark">person</span>
              </div>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest font-bold text-primary mb-1">Editing Profile</h3>
              <h2 className="text-3xl font-bold tracking-tight">
                {profile ? `${profile.firstName} ${profile.lastName}`.trim() : ''} ({profile?.role ?? ROLES.ADMIN})
              </h2>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <ProfileInfoForm
              displayName={settings.displayName}
              email={email}
              accessLevel={settings.accessLevel}
              role={profile?.role}
              onDisplayNameChange={v => handleFieldChange('displayName', v)}
              onAccessLevelChange={v => handleFieldChange('accessLevel', v)}
            />
            <PinInput
              pin={settings.newPin}
              onChange={handlePinChange}
            />
            {profile?.role === ROLES.ADMIN && (
              <TeamAccessSection
                teamProfiles={teamAccess.teamProfiles}
                teamRoles={teamAccess.teamRoles}
                teamLoading={teamAccess.teamLoading}
                teamErrors={teamAccess.teamErrors}
                roomsWithDevices={teamAccess.roomsWithDevices}
                profilePermissions={teamAccess.profilePermissions}
                onRoleChange={(id, role) => teamAccess.setTeamRoles(prev => ({ ...prev, [id]: role }))}
                onApplyRole={teamAccess.handleApplyRole}
                onToggleRoomAccess={teamAccess.handleToggleRoomAccess}
                onToggleDeviceAccess={teamAccess.handleToggleDeviceAccess}
              />
            )}
          </div>
          <div>
            <ThemeSelector theme={theme} onChange={setTheme} />
          </div>
        </div>

        <footer className="border-t border-slate-200 dark:border-primary/10 pt-8">
          {saveError && <p className="text-red-500 text-sm mb-4">{saveError}</p>}
          <div className="flex gap-4">
            <button
              onClick={handleDiscard}
              disabled={!hasChanges}
              className="px-8 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-10 py-3 rounded-xl bg-primary text-background-dark font-black shadow-[0_0_15px_rgba(6,188,249,0.3)] hover:shadow-[0_0_25px_rgba(6,188,249,0.5)] transition-all uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Profile Settings
            </button>
          </div>
        </footer>
      </div>
    </Layout>
  );
}
