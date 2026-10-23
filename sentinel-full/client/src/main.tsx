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
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to ask AI. Please try again.'
      );
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
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const filteredDocs = useMemo(
    () =>
      docs.filter(doc =>
        doc.originalName.toLowerCase().includes(search.toLowerCase())
      ),
    [docs, search]
  );

  const sharedDocs = useMemo(
    () => docs.filter(doc => doc.ownerId !== user?.id),
    [docs, user]
  );

  const ownedDocs = useMemo(
    () => docs.filter(doc => doc.ownerId === user?.id),
    [docs, user]
  );

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-symbol">◆</div>
            <div>
              <h1>SENTINEL</h1>
              <span>SECURE VAULT</span>
            </div>
          </div>

          <div className="login-heading">
            <span className="panel-eyebrow">SECURE DOCUMENT SHARING</span>
            <h2>Welcome back</h2>
            <p>Sign in to access your secure workspace.</p>
          </div>

          {error && <div className="alert error-alert">{error}</div>}
          {message && <div className="alert success-alert">{message}</div>}

          <form onSubmit={login} className="login-form">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in securely'}
            </button>
          </form>

          <div className="login-footer">
            Your documents are protected by Sentinel security controls.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-symbol">◆</div>
          <div>
            <h2>SENTINEL</h2>
            <span>SECURE VAULT</span>
          </div>
        </div>

        <span className="sidebar-label">WORKSPACE</span>

        <nav className="sidebar-nav">
          {([
            ['Overview', '⌂'],
            ['Documents', '▣'],
            ['Shared Access', '♧'],
            ['Security', '◇'],
            ['Profile', '♙'],
          ] as [Page, string][]).map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${page === label ? 'active' : ''}`}
              onClick={() => {
                setPage(label);
                setError('');
                setMessage('');
              }}
            >
              <span>{icon}</span>
              {label}
              {label === 'Documents' && (
                <small className="nav-count">{docs.length}</small>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-security">
          <div className="security-circle">
            <strong>98</strong>
          </div>
          <div>
            <strong>Security Score</strong>
            <span>Excellent protection</span>
          </div>
          <div className="security-progress"><span /></div>
        </div>

        <div className="sidebar-storage">
          <span>♧</span>
          <div>
            <strong>Private Storage</strong>
            <small>Your files stay protected</small>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{page}</strong>
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <span />
              All systems secure
            </div>
            <div className="topbar-user">
              <div className="user-avatar">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{user.name}</strong>
                <small>{user.role}</small>
              </div>
            </div>
            <button className="topbar-button" onClick={() => setPage('Profile')}>
              Profile
            </button>
            <button className="topbar-button logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <div className="page-content">
          {message && (
            <div className="alert success-alert">
              <span>✓</span>{message}
              <button onClick={() => setMessage('')}>×</button>
            </div>
          )}

          {error && (
            <div className="alert error-alert">
              <span>!</span>{error}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          {page === 'Overview' && (
            <OverviewPage
              user={user}
              docs={docs}
              ownedDocs={ownedDocs}
              sharedDocs={sharedDocs}
              formatBytes={formatBytes}
              formatDate={formatDate}
              setPage={setPage}
            />
          )}

          {page === 'Documents' && (
            <DocumentsPage
              docs={filteredDocs}
              user={user}
              search={search}
              setSearch={setSearch}
              uploadFile={uploadFile}
              viewDocument={viewDocument}
              downloadDocument={downloadDocument}
              shareDoc={shareDoc}
              setShareDoc={setShareDoc}
              recipientEmail={recipientEmail}
              setRecipientEmail={setRecipientEmail}
              permission={permission}
              setPermission={setPermission}
              shareDocument={shareDocument}
              revokeShare={revokeShare}
              formatBytes={formatBytes}
              formatDate={formatDate}
              aiDoc={aiDoc}
              setAiDoc={setAiDoc}
              aiQuestion={aiQuestion}
              setAiQuestion={setAiQuestion}
              aiAnswer={aiAnswer}
              setAiAnswer={setAiAnswer}
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
    </div>
  );
}

function OverviewPage({
  user,
  docs,
  ownedDocs,
  sharedDocs,
  formatBytes,
  formatDate,
  setPage,
}: any) {
  const totalStorage = docs.reduce((sum: number, doc: Doc) => sum + doc.size, 0);

  return (
    <>
      <div className="welcome-banner">
        <span>✓</span>
        <div>
          <strong>Welcome to Sentinel</strong>
          <p>Your secure document workspace is ready.</p>
        </div>
      </div>

      <div className="page-title">
        <div>
          <span className="panel-eyebrow">WORKSPACE OVERVIEW</span>
          <h1>Good to see you, {user.name}</h1>
          <p>Manage your documents and keep your information protected.</p>
        </div>
        <div className="security-status-badge"><span />SYSTEM SECURE</div>
      </div>

      <div className="stats-grid">
        <StatCard icon="▤" title="Total Documents" value={docs.length} subtitle="Available to you" />
        <StatCard icon="▣" title="Owned Documents" value={ownedDocs.length} subtitle="Managed by you" />
        <StatCard icon="♧" title="Shared Documents" value={sharedDocs.length} subtitle="Shared with you" />
        <StatCard icon="▥" title="Storage Used" value={formatBytes(totalStorage)} subtitle="Across your documents" />
      </div>

      <div className="overview-grid">
        <div className="panel overview-documents">
          <div className="panel-heading">
            <div><span className="panel-eyebrow">YOUR WORKSPACE</span><h2>Recent Documents</h2></div>
            <button className="text-button" onClick={() => setPage('Documents')}>View all →</button>
          </div>

          {docs.length === 0 ? (
            <div className="empty-state"><div>▤</div><h3>No documents yet</h3><p>Upload a document to get started.</p></div>
          ) : docs.slice(0, 4).map((doc: Doc) => (
            <div className="recent-document" key={doc.id}>
              <div className="file-icon">▤</div>
              <div><strong>{doc.originalName}</strong><small>{formatBytes(doc.size)} · {formatDate(doc.createdAt)}</small></div>
              <span className="recent-status">SECURE</span>
            </div>
          ))}
        </div>

        <div className="panel quick-actions">
          <span className="panel-eyebrow">QUICK ACTIONS</span>
          <h2>Manage your files</h2>
          <p>Use these shortcuts to manage your secure workspace.</p>
          <button onClick={() => setPage('Documents')}>▤ <span>Manage documents</span> →</button>
          <button onClick={() => setPage('Shared Access')}>♧ <span>Shared access</span> →</button>
          <button onClick={() => setPage('Security')}>◇ <span>Security center</span> →</button>
        </div>
      </div>
    </>
  );
}

function DocumentsPage({
  docs,
  user,
  search,
  setSearch,
  uploadFile,
  viewDocument,
  downloadDocument,
  setShareDoc,
  recipientEmail,
  setRecipientEmail,
  permission,
  setPermission,
  shareDocument,
  revokeShare,
  formatBytes,
  formatDate,
  aiDoc,
  setAiDoc,
  aiQuestion,
  setAiQuestion,
  aiAnswer,
  setAiAnswer,
  aiLoading,
  askDocumentAI,
}: any) {
  return (
    <>
      <div className="welcome-banner">
        <span>✓</span>
        <div>
          <strong>Welcome to Sentinel</strong>
          <p>Your documents are protected.</p>
        </div>
      </div>

      <div className="page-title">
        <div>
          <span className="panel-eyebrow">DOCUMENT MANAGEMENT</span>
          <h1>Documents</h1>
          <p>Securely manage all documents available to your account.</p>
        </div>
      </div>

      <div className="upload-bar">
        <label className="upload-button">
          + Secure Upload
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={uploadFile}
            hidden
          />
        </label>
      </div>

      <div className="document-toolbar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents..."
          aria-label="Search documents"
        />
        <span><i /> {docs.length} documents</span>
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
                  }}
                  type="button"
                >
                  ✦ Ask AI
                </button>
              </div>

              {aiDoc?.id === doc.id && (
                <div
                  className="sentinel-ai-panel"
                  style={{
                    flexBasis: '100%',
                    width: '100%',
                    marginTop: 16,
                    padding: 18,
                    border: '1px solid #ddd6fe',
                    borderRadius: 12,
                    background: '#faf9ff',
                  }}
                >
                  <h3 style={{ margin: '0 0 6px', color: '#4c1d95' }}>
                    Ask AI about this document
                  </h3>
                  <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 14 }}>
                    Ask a question using the content of {doc.originalName}.
                  </p>

                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      void askDocumentAI();
                    }}
                  >
                    <textarea
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      placeholder="Example: Summarize this document..."
                      maxLength={2000}
                      rows={3}
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 12,
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        font: 'inherit',
                        resize: 'vertical',
                      }}
                    />

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        type="button"
                        className="action-button secondary"
                        onClick={() => {
                          setAiDoc(null);
                          setAiQuestion('');
                          setAiAnswer('');
                        }}
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="action-button primary"
                        disabled={aiLoading || !aiQuestion.trim()}
                      >
                        {aiLoading ? 'Thinking...' : 'Ask AI'}
                      </button>
                    </div>
                  </form>

                  {aiAnswer && (
                    <div
                      role="status"
                      style={{
                        marginTop: 16,
                        padding: 14,
                        borderRadius: 8,
                        background: '#fff',
                        border: '1px solid #ddd6fe',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: 6, color: '#4c1d95' }}>
                        AI Answer
                      </strong>
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
  return (
    <>
      <div className="page-title">
        <div>
          <span className="panel-eyebrow">ACCOUNT SETTINGS</span>
          <h1>Profile</h1>
          <p>Manage your account details and password.</p>
        </div>
      </div>

      <div className="profile-grid">
        <div className="panel profile-card">
          <div className="profile-avatar">{(user.name || user.email).charAt(0).toUpperCase()}</div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="permission">{user.role}</span>

          <div className="profile-detail"><span>Full name</span><strong>{user.name}</strong></div>
          <div className="profile-detail"><span>Email</span><strong>{user.email}</strong></div>
          <div className="profile-detail"><span>Department</span><strong>{user.department || 'Not specified'}</strong></div>
          <div className="profile-detail"><span>Role</span><strong>{user.role}</strong></div>
        </div>

        <div className="panel password-panel">
          <span className="panel-eyebrow">SECURITY SETTINGS</span>
          <h2>Change password</h2>
          <p>Choose a new password to protect your account.</p>

          <form onSubmit={changePassword}>
            <label htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <button className="login-button" type="submit" disabled={changingPassword}>
              {changingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
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