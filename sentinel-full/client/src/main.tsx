
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = 'https://sentinel-backend-g1wa.onrender.com/api';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string | null;
};

type Share = {
  id: string;
  permission: 'VIEW' | 'DOWNLOAD';
  recipient: {
    email: string;
    name?: string;
  };
};

type Doc = {
  id: string;
  originalName: string;
  size: number;
  createdAt: string;
  ownerId: string;
  owner?: {
    id?: string;
    name: string;
    email: string;
  };
  shares?: Share[];
};

type Page =
  | 'Overview'
  | 'Documents'
  | 'Shared Access'
  | 'Security'
  | 'Profile';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [email, setEmail] = useState('pranavi@sentinel.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<Page>('Overview');
  const [search, setSearch] = useState('');
  const [shareDoc, setShareDoc] = useState<Doc | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
  const [aiDoc, setAiDoc] = useState<Doc | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function api(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(API + path, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `Request failed (${response.status})`
      );
    }

    return data;
  }

  async function loadDocuments() {
    try {
      const data = await api('/documents');

      if (Array.isArray(data)) {
        setDocs(data);
      } else if (Array.isArray(data.documents)) {
        setDocs(data.documents);
      } else {
        setDocs([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load documents');
    }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const loggedInUser = data?.user || data;

      if (!loggedInUser?.id) {
        throw new Error('Login succeeded but user information was not returned.');
      }

      setUser(loggedInUser);
      setPassword('');
      setPage('Overview');
      await loadDocuments();
      setMessage('Welcome to Sentinel');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Clear the local interface even if the server request fails.
    }

    setUser(null);
    setDocs([]);
    setPassword('');
    setPage('Overview');
    setMessage('');
    setError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (changingPassword) return;

    setError('');
    setMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (currentPassword.length > 128) {
      setError('Your current password cannot exceed 128 characters.');
      return;
    }

    if (newPassword.length < 6 || newPassword.length > 128) {
      setError('Your new password must contain between 6 and 128 characters.');
      return;
    }

    if (confirmPassword.length > 128) {
      setError('Your confirmation password cannot exceed 128 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Your new password must be different from your current password.');
      return;
    }

    setChangingPassword(true);
    setMessage('Updating your password...');

    try {
      const data = await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      setEmail(user?.email || email);
      setDocs([]);
      setUser(null);
      setPage('Overview');
      setError('');
      setMessage(
        data?.message ||
        'Password changed successfully. Please log in using your new password.'
      );
    } catch (e) {
      setMessage('');
      setError(
        e instanceof Error
          ? e.message
          : 'Password could not be changed. Please try again.'
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    setError('');
    setMessage('Uploading document...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('category', 'General');

    try {
      await api('/documents', {
        method: 'POST',
        body: formData,
      });

      setError('');
      setMessage(`${file.name} uploaded and secured successfully.`);
      await loadDocuments();
      setPage('Documents');
    } catch (e) {
      setMessage('');
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      input.value = '';
    }
  }

  async function viewDocument(doc: Doc) {
    setError('');
    setMessage('');

    try {
      await api(`/documents/${doc.id}`);
      setMessage(`Authorized access confirmed for ${doc.originalName}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Access denied');
    }
  }

  async function downloadDocument(doc: Doc) {
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API}/documents/${doc.id}/download`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || data.message || `Access denied (${response.status})`
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage('Secure download completed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    }
  }

  async function askDocumentAI() {
    if (!aiDoc || !aiQuestion.trim() || aiLoading) return;

    setError('');
    setMessage('');
    setAiAnswer('');
    setAiLoading(true);

    try {
      const data = await api('/ai/ask', {
        method: 'POST',
        body: JSON.stringify({
          documentId: aiDoc.id,
          question: aiQuestion.trim(),
        }),
      });
      setAiAnswer(data.answer || 'No answer was generated.');
    } catch (e) {
      setAiAnswer('');
      setError(e instanceof Error ? e.message : 'Unable to ask AI. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  async function shareDocument() {
    if (!shareDoc) return;

    setError('');
    setMessage('');

    if (!recipientEmail.trim()) {
      setError('Enter a recipient email address');
      return;
    }

    try {
      await api(`/documents/${shareDoc.id}/share`, {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          permission,
        }),
      });

      setMessage(`Access shared with ${recipientEmail.trim()}`);
      setShareDoc(null);
      setRecipientEmail('');
      setPermission('VIEW');
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to share document');
    }
  }

  async function revokeShare(doc: Doc, shareId: string) {
    setError('');
    setMessage('');

    try {
      await api(`/documents/${doc.id}/revoke/${shareId}`, {
        method: 'POST',
      });

      setMessage('Document access revoked successfully');
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to revoke access');
    }
  }

  function formatBytes(bytes: number) {
    if (!bytes) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  }

  function formatDate(date: string) {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const ownedDocs = docs.filter(doc => doc.ownerId === user?.id);
  const sharedDocs = docs.filter(doc => doc.ownerId !== user?.id);

  const totalShares = ownedDocs.reduce(
    (total, doc) => total + (doc.shares?.length || 0),
    0
  );

  const storageUsed = docs.reduce(
    (total, doc) => total + Number(doc.size || 0),
    0
  );

  const filteredDocs = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return docs;

    return docs.filter(doc =>
      doc.originalName.toLowerCase().includes(value)
    );
  }, [docs, search]);

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-orb orb-one" />
        <div className="login-orb orb-two" />

        <div className="login-shell">
          <div className="login-brand">
            <div className="shield-logo"><span>◆</span></div>
            <div>
              <strong>SENTINEL</strong>
              <small>SECURE DOCUMENT VAULT</small>
            </div>
          </div>

          <div className="login-card">
            <div className="login-icon">🛡</div>

            <div className="login-heading">
              <span className="eyebrow">SECURE ACCESS</span>
              <h1>Welcome back.</h1>
              <p>Your documents. Your permissions. Your control.</p>
            </div>

            {message && (
              <div className="notification success" role="status" aria-live="polite">
                <span>✓</span>
                {message}
                <button type="button" onClick={() => setMessage('')}>×</button>
              </div>
            )}

            <form onSubmit={login}>
              <label>Email address</label>
              <div className="input-wrap">
                <span>✉</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="username"
                  required
                />
              </div>

              <label>Password</label>
              <div className="input-wrap">
                <span>●</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="login-error" role="alert">{error}</div>
              )}

              <button className="login-button" disabled={loading} type="submit">
                <span>{loading ? 'Authenticating...' : 'Enter Secure Vault'}</span>
                <span>→</span>
              </button>
            </form>

            <div className="login-security">
              <span>✓</span>
              <div>
                <strong>Protected session</strong>
                <small>Server-side authentication enabled</small>
              </div>
            </div>
          </div>

          <div className="login-footer">
            <span>● SYSTEM OPERATIONAL</span>
            <span>ENCRYPTED CONNECTION</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-brand">
          <div className="mini-shield">◆</div>
          <div><strong>SENTINEL</strong><span>SECURE VAULT</span></div>
        </div>

        <div className="side-section-title">WORKSPACE</div>

        <nav>
          {(['Overview', 'Documents', 'Shared Access', 'Security', 'Profile'] as Page[]).map(item => (
            <button
              key={item}
              className={`nav-item ${page === item ? 'active' : ''}`}
              onClick={() => {
                setError('');
                setMessage('');
                setPage(item);
              }}
            >
              <span className="nav-icon">
                {item === 'Overview' ? '⌂' :
                  item === 'Documents' ? '▣' :
                    item === 'Shared Access' ? '♧' :
                      item === 'Security' ? '◈' : '♙'}
              </span>
              {item}
              {item === 'Documents' && <span className="nav-count">{docs.length}</span>}
              {item === 'Shared Access' && sharedDocs.length > 0 && (
                <span className="nav-count">{sharedDocs.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-security">
          <div className="security-ring"><span>98</span></div>
          <div><strong>Security Score</strong><small>Excellent protection</small></div>
          <div className="score-line"><span /></div>
        </div>

        <div className="side-bottom">
          <div className="privacy-box">
            <span>🛡</span>
            <div><strong>Private Storage</strong><small>Your files are protected</small></div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span><b>/</b><strong>{page}</strong>
          </div>

          <div className="top-actions">
            <div className="system-status"><span className="pulse" />All systems secure</div>
            <div className="user-menu">
              <div className="avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div><strong>{user.name}</strong><small>{user.role}</small></div>
              <button
                className="logout-button"
                onClick={() => {
                  setError('');
                  setMessage('');
                  setPage('Profile');
                }}
              >
                Profile
              </button>
              <button className="logout-button" onClick={logout}>Logout</button>
            </div>
          </div>
        </header>

        <div className="content">
          {message && (
            <div className="notification success" role="status" aria-live="polite">
              <span>✓</span>{message}
              <button type="button" onClick={() => setMessage('')}>×</button>
            </div>
          )}

          {error && (
            <div className="notification danger" role="alert">
              <span>!</span>{error}
              <button type="button" onClick={() => setError('')}>×</button>
            </div>
          )}

          {page === 'Overview' && (
            <OverviewPage
              user={user}
              docs={docs}
              ownedDocs={ownedDocs}
              sharedDocs={sharedDocs}
              totalShares={totalShares}
              storageUsed={storageUsed}
              formatBytes={formatBytes}
              setPage={setPage}
              uploadFile={uploadFile}
              viewDocument={viewDocument}
              downloadDocument={downloadDocument}
              formatDate={formatDate}
            />
          )}

          {page === 'Documents' && (
            <DocumentsPage
              docs={filteredDocs}
              search={search}
              setSearch={setSearch}
              uploadFile={uploadFile}
              user={user}
              viewDocument={viewDocument}
              downloadDocument={downloadDocument}
              setShareDoc={setShareDoc}
              formatBytes={formatBytes}
              formatDate={formatDate}
              revokeShare={revokeShare}
              aiDoc={aiDoc}
              setAiDoc={setAiDoc}
              aiQuestion={aiQuestion}
              setAiQuestion={setAiQuestion}
              aiAnswer={aiAnswer}
              setAiAnswer={setAiAnswer}
              setError={setError}
              aiLoading={aiLoading}
              askDocumentAI={askDocumentAI}
            />
          )}

          {page === 'Shared Access' && (
            <SharedPage
              docs={sharedDocs}
              viewDocument={viewDocument}
              downloadDocument={downloadDocument}
              formatBytes={formatBytes}
              formatDate={formatDate}
            />
          )}

          {page === 'Security' && <SecurityPage />}

          {page === 'Profile' && (
            <ProfilePage
              user={user}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              changingPassword={changingPassword}
              changePassword={changePassword}
            />
          )}
        </div>
      </main>

      {shareDoc && (
        <div className="modal-backdrop" onClick={() => setShareDoc(null)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShareDoc(null)}>×</button>
            <div className="modal-icon">♧</div>
            <span className="panel-eyebrow">SECURE SHARING</span>
            <h2>Share document</h2>
            <p>Give another Sentinel user controlled access to:</p>
            <div className="modal-file"><span>▤</span><strong>{shareDoc.originalName}</strong></div>

            <label>Recipient email</label>
            <div className="modal-input">
              <span>✉</span>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="employee@sentinel.local"
              />
            </div>

            <label>Permission level</label>
            <div className="permission-selector">
              <button
                type="button"
                className={permission === 'VIEW' ? 'selected' : ''}
                onClick={() => setPermission('VIEW')}
              >
                <strong>VIEW</strong><small>Can open the document</small>
              </button>
              <button
                type="button"
                className={permission === 'DOWNLOAD' ? 'selected' : ''}
                onClick={() => setPermission('DOWNLOAD')}
              >
                <strong>DOWNLOAD</strong><small>Can view and download</small>
              </button>
            </div>

            <button className="modal-share-button" onClick={shareDocument}>
              <span>Grant Secure Access</span><span>→</span>
            </button>
            <div className="modal-warning">
              <span>🛡</span>
              <span>Access can be revoked by the document owner at any time.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePage({
  user,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  changingPassword,
  changePassword,
}: any) {
  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    marginTop: 8,
    border: '1px solid #d5dce7',
    borderRadius: 8,
    background: '#fff',
    color: '#172033',
    fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 16,
    fontWeight: 600,
    color: '#263449',
  };

  return (
    <>
      <div className="page-title">
        <div>
          <span className="panel-eyebrow">ACCOUNT SETTINGS</span>
          <h1>Profile Settings</h1>
          <p>Manage your account details and password.</p>
        </div>
      </div>

      <div className="quick-card">
        <span className="panel-eyebrow">PROFILE INFORMATION</span>
        <div style={{ marginTop: 20 }}>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          {user.department && <p><strong>Department:</strong> {user.department}</p>}
        </div>
      </div>

      <div className="quick-card" style={{ marginTop: 24 }}>
        <span className="panel-eyebrow">ACCOUNT SECURITY</span>
        <h2 style={{ marginTop: 10 }}>Change Password</h2>
        <p>Enter your current password and choose a new password. You will need to log in again after changing it.</p>

        <form
          onSubmit={changePassword}
          noValidate
          style={{ display: 'grid', gap: 4, maxWidth: 480, marginTop: 24 }}
        >
          <label style={labelStyle}>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              maxLength={128}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              maxLength={128}
              required
              style={inputStyle}
            />
            <small style={{ display: 'block', marginTop: 6, color: '#64748b' }}>
              Use at least 6 characters.
            </small>
          </label>

          <label style={labelStyle}>
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              maxLength={128}
              required
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={changingPassword}
            style={{
              marginTop: 8,
              cursor: changingPassword ? 'not-allowed' : 'pointer',
              opacity: changingPassword ? 0.7 : 1,
            }}
          >
            {changingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </>
  );
}

function OverviewPage({
  user,
  docs,
  ownedDocs,
  sharedDocs,
  totalShares,
  storageUsed,
  formatBytes,
  setPage,
  uploadFile,
  viewDocument,
  downloadDocument,
  formatDate,
}: any) {
  return (
    <>
      <section className="hero">
        <div>
          <div className="hero-label"><span />SECURE WORKSPACE</div>
          <h1>Good to see you,<br /><span>{user.name.split(' ')[0]}.</span></h1>
          <p>Manage your sensitive documents with confidence. Every access request is verified by Sentinel.</p>
        </div>
        <div className="hero-shield">
          <div className="shield-glow" />
          <div className="large-shield">◆</div>
          <div className="shield-check">✓</div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard icon="▣" title="Total Documents" value={docs.length} subtitle="Protected files" />
        <StatCard icon="♧" title="Shared Access" value={totalShares} subtitle="Active permissions" />
        <StatCard icon="◉" title="Storage Used" value={formatBytes(storageUsed)} subtitle="Private storage" />
        <StatCard icon="✓" title="Protection" value="98%" subtitle="Security score" />
      </section>

      <section className="overview-grid">
        <div className="quick-card">
          <div className="quick-heading">
            <div><span className="panel-eyebrow">QUICK ACTIONS</span><h2>Manage your vault</h2></div>
          </div>
          <div className="quick-actions">
            <label className="quick-action blue">
              <input type="file" onChange={uploadFile} />
              <span>＋</span><strong>Upload Document</strong><small>Secure a new file</small>
            </label>
            <button className="quick-action purple" onClick={() => setPage('Documents')}>
              <span>▣</span><strong>View Documents</strong><small>Manage your files</small>
            </button>
            <button className="quick-action green" onClick={() => setPage('Shared Access')}>
              <span>♧</span><strong>Shared Access</strong><small>Review permissions</small>
            </button>
            <button className="quick-action orange" onClick={() => setPage('Security')}>
              <span>◈</span><strong>Security Center</strong><small>Check protection</small>
            </button>
          </div>
        </div>

        <div className="recent-card">
          <div className="quick-heading">
            <div><span className="panel-eyebrow">RECENT ACTIVITY</span><h2>Recent Documents</h2></div>
            <button className="text-button" onClick={() => setPage('Documents')}>View all →</button>
          </div>
          {docs.length === 0 ? (
            <div className="small-empty">No documents yet.</div>
          ) : docs.slice(0, 4).map((doc: Doc) => (
            <div className="recent-document" key={doc.id}>
              <div className="recent-icon">▤</div>
              <div><strong>{doc.originalName}</strong><small>{formatDate(doc.createdAt)}</small></div>
              <button onClick={() => viewDocument(doc)}>View</button>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-security">
        <div className="overview-security-icon">🛡</div>
        <div>
          <span className="panel-eyebrow">SENTINEL PROTECTION</span>
          <h2>Your workspace is protected.</h2>
          <p>Authentication, authorization, private storage and document permissions are enforced by the server.</p>
        </div>
        <button onClick={() => setPage('Security')}>Security Center →</button>
      </section>
    </>
  );
}

function DocumentsPage({
  docs,
  search,
  setSearch,
  uploadFile,
  user,
  viewDocument,
  downloadDocument,
  setShareDoc,
  formatBytes,
  formatDate,
  revokeShare,
  aiDoc,
  setAiDoc,
  aiQuestion,
  setAiQuestion,
  aiAnswer,
  setAiAnswer,
  setError,
  aiLoading,
  askDocumentAI,
}: any) {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="panel-eyebrow">DOCUMENT MANAGEMENT</span>
          <h1>Documents</h1>
          <p>Securely manage all documents available to your account.</p>
        </div>
        <label className="upload-button">
          <input type="file" onChange={uploadFile} />＋ Secure Upload
        </label>
      </div>

      <div className="documents-full">
        <div className="document-toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
            />
          </div>
          <div className="protected-label"><span className="green-dot" />{docs.length} documents</div>
        </div>

        <div className="document-list">
          {docs.length === 0 ? (
            <div className="empty-state">
              <div>▣</div><h3>No documents found</h3><p>Upload a document to your secure vault.</p>
            </div>
          ) : docs.map((doc: Doc) => {
            const owner = doc.ownerId === user.id;

            return (
              <article className="document-card" key={doc.id}>
                <div className="file-icon">▤<small>FILE</small></div>
                <div className="file-info">
                  <h3>{doc.originalName}</h3>
                  <div className="file-meta">
                    <span>{formatBytes(doc.size)}</span><i /><span>{formatDate(doc.createdAt)}</span>
                  </div>
                  <div className={owner ? 'owner-badge' : 'owner-badge shared'}>
                    ● {owner ? 'Owned by you' : 'Shared with you'}
                  </div>
                </div>
                <div className="permission-area">
                  <span className="permission">{owner ? 'OWNER' : 'SHARED'}</span>
                </div>
                <div className="document-actions">
                  <button className="action-button secondary" onClick={() => viewDocument(doc)}>View</button>
                  <button className="action-button primary" onClick={() => downloadDocument(doc)}>↓</button>
                  {owner && (
                    <button className="action-button share" onClick={() => setShareDoc(doc)} type="button">Share</button>
                  )}
                  <button
                    className="action-button"
                    style={{ background: '#ede9fe', color: '#6d28d9' }}
                    onClick={() => {
                      setAiDoc(aiDoc?.id === doc.id ? null : doc);
                      setAiQuestion('');
                      setAiAnswer('');
                      setError('');
                    }}
                    type="button"
                  >✦ Ask AI</button>
                </div>

                {aiDoc?.id === doc.id && (
                  <div className="sentinel-ai-panel" style={{ flexBasis: '100%', width: '100%', marginTop: 16, padding: 18, border: '1px solid #ddd6fe', borderRadius: 12, background: '#faf9ff' }}>
                    <h3 style={{ margin: '0 0 6px', color: '#4c1d95' }}>Ask AI about this document</h3>
                    <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 14 }}>Ask a question using the content of {doc.originalName}.</p>
                    <form onSubmit={e => { e.preventDefault(); void askDocumentAI(); }}>
                      <textarea
                        value={aiQuestion}
                        onChange={e => setAiQuestion(e.target.value)}
                        placeholder="Example: Summarize this document..."
                        maxLength={2000}
                        rows={3}
                        required
                        style={{ width: '100%', boxSizing: 'border-box', padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, font: 'inherit', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                        <button type="button" className="action-button secondary" onClick={() => { setAiDoc(null); setAiQuestion(''); setAiAnswer(''); }}>Close</button>
                        <button type="submit" className="action-button primary" disabled={aiLoading || !aiQuestion.trim()}>{aiLoading ? 'Thinking...' : 'Ask AI'}</button>
                      </div>
                    </form>
                    {aiAnswer && (
                      <div role="status" style={{ marginTop: 16, padding: 14, borderRadius: 8, background: '#fff', border: '1px solid #ddd6fe', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        <strong style={{ display: 'block', marginBottom: 6, color: '#4c1d95' }}>AI Answer</strong>
                        {aiAnswer}
                      </div>
                    )}
                  </div>
                )}

                {owner && doc.shares && doc.shares.length > 0 && (
                  <div className="share-strip">
                    {doc.shares.map(share => (
                      <div className="active-share" key={share.id}>
                        <div className="share-avatar">
                          {(share.recipient.name || share.recipient.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{share.recipient.name || share.recipient.email}</strong>
                          <small>{share.permission} permission</small>
                        </div>
                        <button onClick={() => revokeShare(doc, share.id)}>Revoke</button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

function SharedPage({ docs, viewDocument, downloadDocument, formatBytes, formatDate }: any) {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="panel-eyebrow">ACCESS MANAGEMENT</span>
          <h1>Shared Access</h1>
          <p>Documents other users have securely shared with you.</p>
        </div>
        <div className="access-summary"><strong>{docs.length}</strong><span>shared documents</span></div>
      </div>

      <div className="shared-info-banner">
        <div>♧</div>
        <section>
          <strong>Controlled document access</strong>
          <p>Your access depends on the permission granted by the document owner. VIEW access does not allow downloading.</p>
        </section>
      </div>

      <div className="documents-full">
        {docs.length === 0 ? (
          <div className="empty-state">
            <div>♧</div><h3>No shared documents</h3><p>Documents shared with you will appear here.</p>
          </div>
        ) : (
          <div className="shared-grid">
            {docs.map((doc: Doc) => (
              <div className="shared-document-card" key={doc.id}>
                <div className="shared-file-top">
                  <div className="file-icon">▤</div><span className="permission">SHARED</span>
                </div>
                <h3>{doc.originalName}</h3>
                <div className="shared-meta"><span>Size</span><strong>{formatBytes(doc.size)}</strong></div>
                <div className="shared-meta"><span>Shared</span><strong>{formatDate(doc.createdAt)}</strong></div>
                <div className="shared-owner"><span>Owner</span><strong>{doc.owner?.name || 'Document Owner'}</strong></div>
                <div className="shared-actions">
                  <button onClick={() => viewDocument(doc)}>View</button>
                  <button onClick={() => downloadDocument(doc)}>Download</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SecurityPage() {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="panel-eyebrow">SECURITY CENTER</span>
          <h1>Security</h1>
          <p>Monitor the protection mechanisms securing your Sentinel workspace.</p>
        </div>
        <div className="security-status-badge"><span />SYSTEM SECURE</div>
      </div>

      <div className="security-page-grid">
        <div className="security-score-large">
          <span className="panel-eyebrow">OVERALL SECURITY</span>
          <div className="big-score-circle"><div><strong>98</strong><small>/100</small></div></div>
          <h2>Excellent Protection</h2>
          <p>Your workspace currently meets Sentinel's core security controls.</p>
        </div>
        <div className="security-controls">
          <SecurityControl icon="✓" title="Server Authentication" text="Sessions are managed on the server and protected by secure cookies." />
          <SecurityControl icon="✓" title="Role Based Access" text="User permissions are checked by the server before protected operations." />
          <SecurityControl icon="✓" title="IDOR Protection" text="Documents cannot be accessed simply by changing document identifiers." />
          <SecurityControl icon="✓" title="Private Storage" text="Uploaded documents remain behind the application authorization layer." />
          <SecurityControl icon="✓" title="Controlled Sharing" text="Owners can grant VIEW or DOWNLOAD access and revoke it later." />
          <SecurityControl icon="✓" title="Download Authorization" text="VIEW permission cannot be used to download protected files." />
        </div>
      </div>

      <div className="security-principles">
        <div><span>01</span><h3>Zero Trust</h3><p>Every protected request is checked instead of trusting the browser.</p></div>
        <div><span>02</span><h3>Least Privilege</h3><p>Users receive only the access required for their documents.</p></div>
        <div><span>03</span><h3>Secure Sharing</h3><p>Document owners control access and can revoke permissions.</p></div>
        <div><span>04</span><h3>Defense in Depth</h3><p>Authentication, authorization and storage controls work together.</p></div>
      </div>
    </>
  );
}

function StatCard({ icon, title, value, subtitle }: any) {
  return (
    <div className="stat-card">
      <div className="stat-icon blue">{icon}</div>
      <div><span>{title}</span><strong>{value}</strong><small>{subtitle}</small></div>
    </div>
  );
}

function SecurityControl({ icon, title, text }: any) {
  return (
    <div className="security-control">
      <div className="security-control-icon">{icon}</div>
      <div><h3>{title}</h3><p>{text}</p></div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
