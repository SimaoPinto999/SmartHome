import { useState, useEffect, useRef, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useApi } from '../hooks/useApi';
import type { KeyboardEvent } from 'react';
import { ROLES } from '../types/role';
import type { Role } from '../types/role';

interface Profile {
  profileId: number;
  accountId: number;
  firstName: string;
  lastName: string;
  role: Role;
}

interface HouseFormState {
  houseName: string;
  address: string;
  timezone: string;
}

const EMPTY_NEW_PROFILE = { firstName: '', lastName: '', role: ROLES.GUEST, pin: ['', '', '', ''] };
const EMPTY_HOUSE_FORM: HouseFormState = { houseName: '', address: '', timezone: 'Europe/Lisbon' };

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'house' }
  | { type: 'manage' }
  | { type: 'forgot' }

export default function ProfileSelection() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { apiFetch } = useApi();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [pinInput, setPinInput] = useState<string[]>(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  const [modal, dispatch] = useReducer((_: ModalState, action: ModalState) => action, { type: 'none' });

  const [newProfile, setNewProfile] = useState(EMPTY_NEW_PROFILE);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [houseForm, setHouseForm] = useState<HouseFormState>(EMPTY_HOUSE_FORM);
  const [isCreatingHouse, setIsCreatingHouse] = useState(false);
  const [houseError, setHouseError] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [newPinReset, setNewPinReset] = useState(['', '', '', '']);
  const [confirmPinReset, setConfirmPinReset] = useState(['', '', '', '']);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const newPinResetRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinResetRefs = useRef<(HTMLInputElement | null)[]>([]);
  const accountIdRef = useRef<number | null>(null);
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = auth.user?.profile?.email || auth.user?.profile?.preferred_username;

  useEffect(() => {
    if (!email) {
      setIsLoadingProfiles(false);
      return;
    }

    apiFetch(`/api/accounts/me`)
      .then(res => {
        if (!res.ok) throw new Error('Account not found');
        return res.json();
      })
      .then(account => {
        accountIdRef.current = account.accountId;
        return apiFetch(`/api/profiles/account/${account.accountId}`);
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profiles');
        return res.json();
      })
      .then((data: Profile[]) => {
        const sorted = [...data].sort((a, b) => a.profileId - b.profileId);
        setProfiles(sorted);
        if (sorted.length > 0) setSelectedProfileId(sorted[0].profileId);
      })
      .catch(console.error)
      .finally(() => setIsLoadingProfiles(false));
  }, [email]);

  const selectedProfile = profiles.find(p => p.profileId === selectedProfileId);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pinInput];
    newPin[index] = value.slice(-1);
    setPinInput(newPin);
    setPinError(false);

    if (value && index < 3) {
      const nextInput = document.querySelector(`#pin-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }

    if (newPin.every(p => p !== '')) {
      submitPin(newPin.join(''));
    }
  };

  const handlePinBackspace = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinInput[index] && index > 0) {
      const prevInput = document.querySelector(`#pin-${index - 1}`) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const submitPin = async (pin: string) => {
    if (!selectedProfileId) return;
    setIsVerifying(true);
    try {
      const res = await apiFetch(`/api/profiles/${selectedProfileId}/verify-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        sessionStorage.setItem('activeProfile', JSON.stringify(selectedProfile));
        navigate('/dashboard', { state: { profile: selectedProfile } });
      } else {
        setPinError(true);
        setShakeKey(k => k + 1);
        setPinInput(['', '', '', '']);
        setTimeout(() => {
          (document.querySelector('#pin-0') as HTMLInputElement)?.focus();
        }, 50);
      }
    } catch {
      setPinError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPin = async () => {
    if (!selectedProfile) return;
    const pin = newPinReset.join('');
    const confirm = confirmPinReset.join('');
    if (pin !== confirm) { setResetError('PINs do not match'); return; }
    setIsResetting(true);
    setResetError('');
    try {
      const res = await apiFetch(`/api/profiles/${selectedProfile.profileId}`, {
        method: 'PUT',
        body: JSON.stringify({
          accountId: selectedProfile.accountId,
          firstName: selectedProfile.firstName,
          lastName: selectedProfile.lastName,
          role: selectedProfile.role,
          pin,
        }),
      });
      if (res.ok) {
        dispatch({ type: 'none' });
        setNewPinReset(['', '', '', '']);
        setConfirmPinReset(['', '', '', '']);
      } else {
        setResetError('Failed to update PIN');
      }
    } catch {
      setResetError('Network error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleNewPinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...newProfile.pin];
    updated[index] = value.slice(-1);
    setNewProfile(p => ({ ...p, pin: updated }));
    if (value && index < 3) newPinRefs.current[index + 1]?.focus();
  };

  const handleNewPinBackspace = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !newProfile.pin[index] && index > 0) {
      newPinRefs.current[index - 1]?.focus();
    }
  };

  const handleCreateProfile = async () => {
    if (!accountIdRef.current) return;
    setCreateError('');
    setIsCreating(true);
    const isFirstProfile = profiles.length === 0;
    try {
      const res = await apiFetch('/api/profiles', {
        method: 'POST',
        body: JSON.stringify({
          accountId: accountIdRef.current,
          firstName: newProfile.firstName.trim(),
          lastName: newProfile.lastName.trim(),
          role: isFirstProfile ? ROLES.ADMIN : newProfile.role,
          pin: newProfile.pin.join(''),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setCreateError(err.message ?? 'Failed to create profile');
        return;
      }
      const created: Profile = await res.json();
      setProfiles(prev => [...prev, created]);
      dispatch({ type: 'none' });
      setNewProfile(EMPTY_NEW_PROFILE);
      if (isFirstProfile) {
        setHouseForm(EMPTY_HOUSE_FORM);
        setHouseError('');
        dispatch({ type: 'house' });
      }
    } catch {
      setCreateError('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateHouse = async () => {
    if (!accountIdRef.current || !houseForm.houseName.trim()) return;
    setHouseError('');
    setIsCreatingHouse(true);
    try {
      const res = await apiFetch('/api/houses', {
        method: 'POST',
        body: JSON.stringify({
          accountId: accountIdRef.current,
          houseName: houseForm.houseName.trim(),
          address: houseForm.address.trim(),
          timezone: houseForm.timezone || 'UTC',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setHouseError(err.message ?? 'Failed to create house');
        return;
      }
      dispatch({ type: 'none' });
    } catch {
      setHouseError('Network error');
    } finally {
      setIsCreatingHouse(false);
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    setDeletingId(profileId);
    setConfirmDeleteId(null);
    try {
      const res = await apiFetch(`/api/profiles/${profileId}`, { method: 'DELETE' });
      if (res.ok) {
        setProfiles(prev => prev.filter(p => p.profileId !== profileId));
        if (selectedProfileId === profileId) setSelectedProfileId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const isPinComplete = pinInput.every(p => p !== '');
  const isNewPinComplete = newProfile.pin.every(p => p !== '');
  const isNewProfileValid = newProfile.firstName.trim() !== '' && isNewPinComplete;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark text-slate-100">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-6 lg:px-12 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">hub</span>
          </div>
          <h2 className="text-white text-xl font-bold tracking-tight">SmartHome</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              await auth.removeUser();
              window.location.href = 'http://localhost:9090/flows/-/default/invalidation/';
            }}
            className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
            title="Sair da conta"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Who's Controlling?</h1>
          <p className="text-primary/60 text-lg">Select a profile to manage your smart environment</p>
        </div>

        {/* Profile Grid */}
        {isLoadingProfiles ? (
          <div className="flex flex-col items-center gap-4 mb-20">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">autorenew</span>
            <p className="text-slate-400 text-sm">Loading profiles...</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 w-full max-w-6xl mb-20">
            {profiles.map((profile) => (
              <div
                key={profile.profileId}
                onClick={() => {
                  setSelectedProfileId(profile.profileId);
                  setPinInput(['', '', '', '']);
                  setPinError(false);
                  setTimeout(() => (document.querySelector('#pin-0') as HTMLInputElement)?.focus(), 50);
                }}
                className="group cursor-pointer profile-card flex flex-col items-center gap-4 transition-all"
              >
                <div
                  className={`profile-avatar relative w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 bg-[#1e3a44] flex items-center justify-center transition-all ${
                    selectedProfileId === profile.profileId
                      ? 'border-primary selected-glow'
                      : 'border-transparent hover:border-slate-500'
                  }`}
                >
                  <span className={`material-symbols-outlined text-6xl transition-colors ${
                    selectedProfileId === profile.profileId ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
                  }`}>
                    person
                  </span>
                  {selectedProfileId === profile.profileId && (
                    <div className="absolute -top-1 -right-1 bg-primary text-background-dark font-bold text-[10px] px-2 py-1 rounded uppercase">
                      Current
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className={`profile-name text-lg font-bold transition-colors ${
                    selectedProfileId === profile.profileId ? 'text-white' : 'text-slate-400'
                  }`}>
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-primary/50 text-[10px] uppercase tracking-widest font-bold">
                    {profile.role}
                  </p>
                </div>
              </div>
            ))}

            {/* Add Profile Button */}
            <div
              onClick={() => dispatch({ type: 'add' })}
              className="group cursor-pointer profile-card flex flex-col items-center gap-4"
            >
              <div className="profile-avatar w-32 h-32 md:w-40 md:h-40 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center hover:bg-primary/5 hover:border-primary transition-all">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">add</span>
                </div>
              </div>
              <p className="profile-name text-primary/60 text-lg font-bold transition-colors">Add User</p>
            </div>
          </div>
        )}

        {/* PIN Entry */}
        <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className={`text-xs font-bold tracking-[0.3em] uppercase mb-8 ${pinError ? 'text-red-400' : 'text-primary/40'}`}>
            {pinError ? 'Wrong PIN — Try Again' : 'Enter PIN'}
          </h2>

          <div key={shakeKey} className={`flex justify-center gap-5 mb-10 ${pinError ? 'pin-shake' : ''}`}>
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                id={`pin-${index}`}
                autoFocus={index === 0}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={pinInput[index]}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handlePinBackspace(index, e)}
                disabled={isVerifying}
                className={`pin-input w-12 h-14 text-center text-2xl font-light bg-primary/5 border focus:ring-0 rounded-lg text-white transition-all outline-none disabled:opacity-50 ${
                  pinError ? 'border-red-400 focus:border-red-400' : 'border-primary/20 focus:border-primary'
                }`}
              />
            ))}
          </div>

          <div className="w-full space-y-6">
            <button
              onClick={() => isPinComplete && submitPin(pinInput.join(''))}
              disabled={!isPinComplete || isVerifying}
              className={`glass-button w-full font-bold tracking-widest py-4 rounded-lg uppercase text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                isPinComplete && !isVerifying
                  ? 'text-primary hover:bg-primary/20'
                  : 'text-primary/50 cursor-not-allowed opacity-50'
              }`}
            >
              {isVerifying && <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>}
              Unlock Dashboard
            </button>

            <div className="flex justify-center">
              <button
                onClick={() => { setResetError(''); setNewPinReset(['', '', '', '']); setConfirmPinReset(['', '', '', '']); dispatch({ type: 'forgot' }); }}
                className="text-primary/40 hover:text-primary text-[10px] uppercase tracking-widest font-bold transition-colors"
              >
                Forgot Access Pin?
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <button
            onClick={() => dispatch({ type: 'manage' })}
            className="px-8 py-2 rounded-lg border border-primary/10 text-primary/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold tracking-widest uppercase"
          >
            Manage Profiles
          </button>
        </div>
      </main>

      {/* Forgot PIN Modal */}
      {modal.type === 'forgot' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#0d1f26] border border-primary/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-xl font-bold">Reset PIN</h2>
              <button
                onClick={() => dispatch({ type: 'none' })}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <p className="text-primary/50 text-xs mb-8">
              Profile: <span className="text-white font-bold">{selectedProfile?.firstName} {selectedProfile?.lastName}</span>
            </p>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-3 block">New PIN</label>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      ref={el => { newPinResetRefs.current[i] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={newPinReset[i]}
                      onChange={e => {
                        if (!/^\d*$/.test(e.target.value)) return;
                        const updated = [...newPinReset]; updated[i] = e.target.value.slice(-1); setNewPinReset(updated);
                        if (e.target.value && i < 3) newPinResetRefs.current[i + 1]?.focus();
                      }}
                      onKeyDown={e => { if (e.key === 'Backspace' && !newPinReset[i] && i > 0) newPinResetRefs.current[i - 1]?.focus(); }}
                      className="pin-input w-12 h-14 text-center text-2xl font-light bg-primary/5 border border-primary/20 focus:border-primary rounded-lg text-white outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-3 block">Confirm PIN</label>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      ref={el => { confirmPinResetRefs.current[i] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={confirmPinReset[i]}
                      onChange={e => {
                        if (!/^\d*$/.test(e.target.value)) return;
                        const updated = [...confirmPinReset]; updated[i] = e.target.value.slice(-1); setConfirmPinReset(updated);
                        if (e.target.value && i < 3) confirmPinResetRefs.current[i + 1]?.focus();
                      }}
                      onKeyDown={e => { if (e.key === 'Backspace' && !confirmPinReset[i] && i > 0) confirmPinResetRefs.current[i - 1]?.focus(); }}
                      className="pin-input w-12 h-14 text-center text-2xl font-light bg-primary/5 border border-primary/20 focus:border-primary rounded-lg text-white outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
            </div>

            {resetError && <p className="text-red-400 text-xs text-center mt-4">{resetError}</p>}

            <button
              onClick={handleResetPin}
              disabled={newPinReset.some(p => !p) || confirmPinReset.some(p => !p) || isResetting}
              className={`glass-button w-full font-bold tracking-widest py-4 rounded-lg uppercase text-xs mt-8 transition-all flex items-center justify-center gap-2 ${
                !newPinReset.some(p => !p) && !confirmPinReset.some(p => !p) && !isResetting
                  ? 'text-primary hover:bg-primary/20'
                  : 'text-primary/50 cursor-not-allowed opacity-50'
              }`}
            >
              {isResetting && <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>}
              Save new PIN
            </button>
          </div>
        </div>
      )}

      {/* Manage Profiles Modal */}
      {modal.type === 'manage' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#0d1f26] border border-primary/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white text-xl font-bold">Manage Profiles</h2>
              <button
                onClick={() => dispatch({ type: 'none' })}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-3">
              {profiles.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No profiles yet.</p>
              )}
              {profiles.map(profile => (
                <div key={profile.profileId} className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-2xl">person</span>
                      <div>
                        <p className="text-white text-sm font-bold">{profile.firstName} {profile.lastName}</p>
                        <p className="text-primary/50 text-[10px] uppercase tracking-widest font-bold">{profile.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmDeleteId(profile.profileId)}
                      disabled={deletingId === profile.profileId}
                      className="flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                      title="Delete profile"
                    >
                      {deletingId === profile.profileId
                        ? <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                        : <span className="material-symbols-outlined text-sm">delete</span>
                      }
                    </button>
                  </div>

                  {confirmDeleteId === profile.profileId && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-red-500/20 pt-3">
                      {profile.role === ROLES.ADMIN && profiles.filter(p => p.role === ROLES.ADMIN).length === 1 && (
                        <p className="text-amber-400 text-xs font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">warning</span>
                          This is the only administrator. You will be left with no admin.
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                      <p className="text-red-400 text-xs font-bold">Are you sure?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs font-bold hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile.profileId)}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Profile Modal */}
      {modal.type === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#0d1f26] border border-primary/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white text-xl font-bold">New Profile</h2>
              <button
                onClick={() => { dispatch({ type: 'none' }); setNewProfile(EMPTY_NEW_PROFILE); setCreateError(''); }}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {profiles.length === 0 && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 mb-4">
                <span className="material-symbols-outlined text-primary text-sm">info</span>
                <p className="text-primary/80 text-xs">The first profile will be created as <span className="font-bold text-primary">Admin</span>.</p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-1 block">First Name</label>
                  <input
                    type="text"
                    value={newProfile.firstName}
                    onChange={e => setNewProfile(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="Ana"
                    className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-1 block">Last Name</label>
                  <input
                    type="text"
                    value={newProfile.lastName}
                    onChange={e => setNewProfile(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Silva"
                    className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {profiles.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-1 block">Role</label>
                  <select
                    value={newProfile.role}
                    onChange={e => setNewProfile(p => ({ ...p, role: e.target.value as Role }))}
                    className="w-full bg-[#0d1f26] border border-primary/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
                  >
                    <option value="GUEST" className="bg-[#0d1f26] text-white">Guest</option>
                    <option value="ADMIN" className="bg-[#0d1f26] text-white">Admin</option>
                    <option value="RESTRICTED" className="bg-[#0d1f26] text-white">Restricted</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-3 block">PIN (4 digits)</label>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map(index => (
                    <input
                      key={index}
                      ref={el => { newPinRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={newProfile.pin[index]}
                      onChange={e => handleNewPinChange(index, e.target.value)}
                      onKeyDown={e => handleNewPinBackspace(index, e)}
                      className="pin-input w-12 h-14 text-center text-2xl font-light bg-primary/5 border border-primary/20 focus:border-primary rounded-lg text-white outline-none transition-all"
                    />
                  ))}
                </div>
              </div>
            </div>

            {createError && (
              <p className="text-red-400 text-xs text-center mb-4">{createError}</p>
            )}

            <button
              onClick={handleCreateProfile}
              disabled={!isNewProfileValid || isCreating}
              className={`glass-button w-full font-bold tracking-widest py-4 rounded-lg uppercase text-xs transition-all flex items-center justify-center gap-2 ${
                isNewProfileValid && !isCreating
                  ? 'text-primary hover:bg-primary/20'
                  : 'text-primary/50 cursor-not-allowed opacity-50'
              }`}
            >
              {isCreating && <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>}
              Create Profile
            </button>
          </div>
        </div>
      )}

      {/* House Setup Modal */}
      {modal.type === 'house' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#0d1f26] border border-primary/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">home</span>
              </div>
              <h2 className="text-white text-2xl font-bold">Set Up Your Home</h2>
              <p className="text-slate-400 text-sm mt-2">Give your smart home a name and location.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-1 block">
                  Home Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={houseForm.houseName}
                  onChange={e => setHouseForm(f => ({ ...f, houseName: e.target.value }))}
                  placeholder="My Smart Home"
                  className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-1 block">Address</label>
                <input
                  type="text"
                  value={houseForm.address}
                  onChange={e => setHouseForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Rua das Flores 12, Lisboa"
                  className="w-full bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/50 font-bold mb-1 block">Timezone</label>
                <input
                  list="timezones"
                  value={houseForm.timezone}
                  onChange={e => setHouseForm(f => ({ ...f, timezone: e.target.value }))}
                  className="w-full bg-[#0d1f26] border border-primary/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Europe/Lisbon"
                />
                <datalist id="timezones">
                  {(houseForm.timezone.length >= 2
                    ? Intl.supportedValuesOf('timeZone').filter(tz => tz.toLowerCase().includes(houseForm.timezone.toLowerCase()))
                    : Intl.supportedValuesOf('timeZone').filter(tz => tz.startsWith('Europe/') || tz === 'UTC')
                  ).map(tz => <option key={tz} value={tz} />)}
                </datalist>
              </div>
            </div>

            {houseError && <p className="text-red-400 text-xs text-center mb-4">{houseError}</p>}

            <button
              onClick={handleCreateHouse}
              disabled={!houseForm.houseName.trim() || isCreatingHouse}
              className={`glass-button w-full font-bold tracking-widest py-4 rounded-lg uppercase text-xs transition-all flex items-center justify-center gap-2 ${
                houseForm.houseName.trim() && !isCreatingHouse
                  ? 'text-primary hover:bg-primary/20'
                  : 'text-primary/50 cursor-not-allowed opacity-50'
              }`}
            >
              {isCreatingHouse && <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>}
              <span className="material-symbols-outlined text-sm">home</span>
              Create Home
            </button>
          </div>
        </div>
      )}

      <style>{`
        .profile-avatar {
          transition: transform 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .profile-card:hover .profile-avatar {
          transform: scale(1.05);
        }
        .selected-glow {
          box-shadow: 0 0 25px rgba(6, 188, 249, 0.4);
        }
        .pin-input:focus {
          box-shadow: 0 0 15px rgba(6, 188, 249, 0.3);
          background: rgba(6, 188, 249, 0.05);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .pin-shake {
          animation: shake 0.4s ease-in-out;
        }
        .glass-button {
          background: linear-gradient(135deg, rgba(6, 188, 249, 0.1) 0%, rgba(6, 188, 249, 0.05) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(6, 188, 249, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(6, 188, 249, 0.2) 0%, rgba(6, 188, 249, 0.1) 100%);
          border-color: rgba(6, 188, 249, 0.4);
          box-shadow: 0 0 20px rgba(6, 188, 249, 0.15);
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
