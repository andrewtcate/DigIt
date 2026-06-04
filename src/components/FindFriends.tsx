import { useState } from 'react';
import { X, UserPlus, Check, Users, Phone } from 'lucide-react';

interface ContactFriend {
  id: string;
  name: string;
  initials: string;
  onApp: boolean;
  username?: string;
  avatar?: string;
  followed: boolean;
}

// Simulated contacts — in a real app these come from navigator.contacts
const MOCK_CONTACTS: ContactFriend[] = [
  { id: 'f1', name: 'Sarah Johnson',    initials: 'SJ', onApp: true,  username: 'sarahj_garden',  avatar: 'https://i.pravatar.cc/150?img=16', followed: false },
  { id: 'f2', name: 'Mike Chen',        initials: 'MC', onApp: true,  username: 'mikegrows',       avatar: 'https://i.pravatar.cc/150?img=17', followed: false },
  { id: 'f3', name: 'Emma Davis',       initials: 'ED', onApp: false, followed: false },
  { id: 'f4', name: 'James Wilson',     initials: 'JW', onApp: true,  username: 'jwilsongrows',   avatar: 'https://i.pravatar.cc/150?img=18', followed: true  },
  { id: 'f5', name: 'Olivia Brown',     initials: 'OB', onApp: false, followed: false },
  { id: 'f6', name: 'Noah Martinez',    initials: 'NM', onApp: true,  username: 'noahplants',     avatar: 'https://i.pravatar.cc/150?img=19', followed: false },
  { id: 'f7', name: 'Ava Taylor',       initials: 'AT', onApp: false, followed: false },
  { id: 'f8', name: 'Will Anderson',    initials: 'WA', onApp: true,  username: 'will_garden',    avatar: 'https://i.pravatar.cc/150?img=20', followed: false },
  { id: 'f9', name: 'Sophia Thomas',    initials: 'ST', onApp: false, followed: false },
  { id: 'f10', name: 'Liam Jackson',   initials: 'LJ', onApp: true,  username: 'liamroots',      avatar: 'https://i.pravatar.cc/150?img=21', followed: false },
  { id: 'f11', name: 'Isabella White',  initials: 'IW', onApp: false, followed: false },
  { id: 'f12', name: 'Ethan Harris',   initials: 'EH', onApp: true,  username: 'ethan_harvest',  avatar: 'https://i.pravatar.cc/150?img=22', followed: false },
];

type SyncState = 'idle' | 'syncing' | 'done';

interface Props {
  onClose: () => void;
}

export default function FindFriends({ onClose }: Props) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [contacts, setContacts] = useState<ContactFriend[]>([]);

  const syncContacts = async () => {
    setSyncState('syncing');

    // Use real Contacts API if available (iOS 14.5+, Android Chrome 80+)
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const raw = await (navigator.contacts as {
          select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[] }[]>
        }).select(['name'], { multiple: true });

        // Match against mock "Dig It users" by name similarity for demo
        const matched = MOCK_CONTACTS.map(c => {
          const realMatch = raw.find(r =>
            r.name?.[0]?.toLowerCase().includes(c.name.split(' ')[0].toLowerCase())
          );
          return realMatch ? c : null;
        }).filter(Boolean) as ContactFriend[];

        setContacts(matched.length > 0 ? matched : MOCK_CONTACTS);
      } catch {
        setContacts(MOCK_CONTACTS);
      }
    } else {
      // Fallback: simulate a short loading delay then show mock contacts
      await new Promise(r => setTimeout(r, 1200));
      setContacts(MOCK_CONTACTS);
    }

    setSyncState('done');
  };

  const toggleFollow = (id: string) => {
    setContacts(prev =>
      prev.map(c => c.id === id ? { ...c, followed: !c.followed } : c)
    );
  };

  const onApp    = contacts.filter(c => c.onApp);
  const notOnApp = contacts.filter(c => !c.onApp);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ maxWidth: 430, margin: '0 auto' }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl slide-up flex flex-col max-h-[88vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-garden-600" />
            <h3 className="font-semibold text-gray-900">Find Friends</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 p-1 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {syncState === 'idle' && (
            <div className="flex flex-col items-center px-8 py-10 text-center">
              <div className="w-20 h-20 bg-garden-100 rounded-full flex items-center justify-center mb-4">
                <Phone size={32} className="text-garden-600" />
              </div>
              <h4 className="font-semibold text-gray-900 text-lg mb-2">Find your people</h4>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Sync your contacts to see which of your friends are already on Dig It.
                We never store your contacts.
              </p>
              <button
                onClick={syncContacts}
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus size={18} />
                Sync Contacts
              </button>
              <p className="text-xs text-gray-400 mt-4">
                Your contacts are matched locally and never uploaded.
              </p>
            </div>
          )}

          {syncState === 'syncing' && (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="w-12 h-12 border-3 border-garden-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Finding your friends on Dig It…</p>
            </div>
          )}

          {syncState === 'done' && (
            <div className="pb-6">
              {/* On Dig It */}
              {onApp.length > 0 && (
                <section>
                  <div className="px-5 pt-4 pb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      On Dig It · {onApp.length}
                    </h4>
                  </div>
                  {onApp.map(c => (
                    <ContactRow key={c.id} contact={c} onToggle={() => toggleFollow(c.id)} />
                  ))}
                </section>
              )}

              {/* Invite */}
              {notOnApp.length > 0 && (
                <section className="mt-2">
                  <div className="px-5 pt-4 pb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Invite to Dig It · {notOnApp.length}
                    </h4>
                  </div>
                  {notOnApp.map(c => (
                    <InviteRow key={c.id} contact={c} />
                  ))}
                </section>
              )}

              {contacts.length === 0 && (
                <div className="text-center py-12 px-8">
                  <div className="text-4xl mb-3">🌱</div>
                  <p className="text-gray-600 font-medium">None of your contacts are on Dig It yet</p>
                  <p className="text-gray-400 text-sm mt-1">Be the first to invite them!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ contact, onToggle }: { contact: ContactFriend; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 active:bg-gray-50 transition-colors">
      {contact.avatar ? (
        <img src={contact.avatar} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-11 h-11 rounded-full bg-garden-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-garden-700">{contact.initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900">{contact.name}</div>
        <div className="text-xs text-garden-600">@{contact.username}</div>
      </div>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95
          ${contact.followed
            ? 'bg-gray-100 text-gray-600 border border-gray-200'
            : 'bg-garden-600 text-white'}`}
      >
        {contact.followed ? (
          <><Check size={12} /> Following</>
        ) : (
          <><UserPlus size={12} /> Follow</>
        )}
      </button>
    </div>
  );
}

function InviteRow({ contact }: { contact: ContactFriend }) {
  const [invited, setInvited] = useState(false);
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-gray-500">{contact.initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900">{contact.name}</div>
        <div className="text-xs text-gray-400">Not on Dig It yet</div>
      </div>
      <button
        onClick={() => setInvited(true)}
        disabled={invited}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95
          ${invited
            ? 'border-gray-200 text-gray-400'
            : 'border-garden-500 text-garden-600 active:bg-garden-50'}`}
      >
        {invited ? 'Invited ✓' : 'Invite'}
      </button>
    </div>
  );
}
