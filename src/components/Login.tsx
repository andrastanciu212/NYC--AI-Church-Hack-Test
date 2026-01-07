import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  organizationType: 'church' | 'ministry' | 'nonprofit' | 'civic_group';
  organizationEmail: string;
  organizationPhone: string;
  role: string;
}

function Login({ onLogin }: LoginProps) {
  const [isJoin, setIsJoin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
    organizationType: 'church',
    organizationEmail: '',
    organizationPhone: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isJoin) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: signUpData.email,
          password: signUpData.password,
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Failed to create user');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            full_name: signUpData.fullName,
            organization: signUpData.organizationName,
            organization_type: signUpData.organizationType,
            organization_email: signUpData.organizationEmail,
            organization_phone: signUpData.organizationPhone,
            role: signUpData.role || null,
          }] as any);

        if (profileError) throw profileError;

        setMessage('Account created successfully! You can now sign in.');
        setIsJoin(false);
        setSignUpData({
          email: '',
          password: '',
          fullName: '',
          organizationName: '',
          organizationType: 'church',
          organizationEmail: '',
          organizationPhone: '',
          role: '',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/unnamed-10.png" alt="See New York" className="login-logo" />
        <h1 className="login-title">NYC Ecosystem Gap Finder</h1>
        <p className="login-subtitle">
          Track and analyze service gaps across New York City
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isJoin ? 'Create Organization Account' : 'Sign In'}</h2>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          {isJoin ? (
            <>
              <div className="form-section">
                <h3>Organization Information</h3>
                <div className="form-group">
                  <label htmlFor="organizationName">Organization Name *</label>
                  <input
                    type="text"
                    id="organizationName"
                    value={signUpData.organizationName}
                    onChange={(e) => setSignUpData({ ...signUpData, organizationName: e.target.value })}
                    required
                    placeholder="Your organization name"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="organizationType">Organization Type *</label>
                  <select
                    id="organizationType"
                    value={signUpData.organizationType}
                    onChange={(e) => setSignUpData({ ...signUpData, organizationType: e.target.value as any })}
                    required
                    disabled={loading}
                  >
                    <option value="church">Church</option>
                    <option value="ministry">Ministry</option>
                    <option value="nonprofit">Nonprofit</option>
                    <option value="civic_group">Civic Group</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="organizationEmail">Organization Email *</label>
                    <input
                      type="email"
                      id="organizationEmail"
                      value={signUpData.organizationEmail}
                      onChange={(e) => setSignUpData({ ...signUpData, organizationEmail: e.target.value })}
                      required
                      placeholder="contact@organization.org"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="organizationPhone">Organization Phone</label>
                    <input
                      type="tel"
                      id="organizationPhone"
                      value={signUpData.organizationPhone}
                      onChange={(e) => setSignUpData({ ...signUpData, organizationPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Account Administrator</h3>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    required
                    placeholder="Your full name"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Your Role</label>
                  <input
                    type="text"
                    id="role"
                    value={signUpData.role}
                    onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value })}
                    placeholder="e.g., Director, Pastor, Coordinator"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signupEmail">Email *</label>
                  <input
                    type="email"
                    id="signupEmail"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                    placeholder="your.email@example.com"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signupPassword">Password *</label>
                  <input
                    type="password"
                    id="signupPassword"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                    placeholder="At least 6 characters"
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Processing...' : isJoin ? 'Create Account' : 'Sign In'}
          </button>

          <div className="toggle-mode">
            {isJoin ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsJoin(!isJoin);
                setError(null);
                setMessage(null);
              }}
              className="toggle-button"
              disabled={loading}
            >
              {isJoin ? 'Sign In' : 'Create Organization Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
