import { useState } from 'react';
import { getJudge0Config, saveJudge0Config } from '../utils/judge0';
import { Check, X, Server, Key, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

export default function Judge0Modal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const currentConfig = getJudge0Config();
  const [apiUrl, setApiUrl] = useState(currentConfig.apiUrl || 'https://ce.judge0.com');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    saveJudge0Config({ apiUrl: apiUrl.trim(), apiKey: apiKey.trim() });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetDefault = () => {
    setApiUrl('https://ce.judge0.com');
    setApiKey('');
    saveJudge0Config({ apiUrl: '', apiKey: '' });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Submitting hello-world test to compiler endpoint...');
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (apiKey.trim()) {
        headers['X-RapidAPI-Key'] = apiKey.trim();
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
      }

      const res = await fetch(`${apiUrl.trim().replace(/\/+$/, '')}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_code: '#include <iostream>\nint main(){ std::cout << "OK"; return 0; }',
          language_id: 54,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMessage(`Connected successfully! Output: ${data.stdout || 'OK'}`);
      } else {
        setTestStatus('error');
        setTestMessage(`Endpoint returned HTTP ${res.status}. Falling back to Piston code engine.`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(`Failed to reach endpoint (${err.message}). FASTudy will automatically use the Piston compiler fallback.`);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="auth-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={20} color="#2f81f7" />
            <h2 className="auth-title">Judge0 Compiler Configuration</h2>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '14px' }}>
            FASTudy compiles your C/C++ code and executes Bugsy's edge cases using Judge0.
            Three setup modes are supported:
          </p>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              1. Free Public Judge0 CE (Default - Ready to Use)
            </div>
            <div>Uses <code>https://ce.judge0.com</code>. No key required. If rate-limited, FASTudy automatically switches to the high-speed Piston engine.</div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              2. RapidAPI Judge0 (High Quota)
            </div>
            <div>
              Subscribe to Judge0 CE on RapidAPI (free tier available) and enter your RapidAPI Key below.
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '12px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              3. Self-Hosted Judge0 (Local Docker)
            </div>
            <div>
              Run Judge0 on your machine via Docker: <code>http://localhost:2358</code>. Enter the local URL below for unlimited instant execution.
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Judge0 API URL
              </label>
              <input
                type="text"
                className="auth-input"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://ce.judge0.com or http://localhost:2358"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                RapidAPI Key (Optional)
              </label>
              <input
                type="password"
                className="auth-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional RapidAPI key"
              />
            </div>

            {testMessage && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '14px',
                fontSize: '13px',
                background: testStatus === 'success' ? 'rgba(46, 160, 67, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                color: testStatus === 'success' ? '#3fb950' : '#f85149',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {testStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{testMessage}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={testStatus === 'testing' ? 'spin' : ''} />
                  <span>Test Endpoint</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResetDefault}
                >
                  Reset Defaults
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {savedNotice && <span style={{ color: '#3fb950', fontSize: '13px' }}>Saved!</span>}
                <button type="submit" className="btn-primary">
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
