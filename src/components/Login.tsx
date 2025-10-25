import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

function Login({ onLogin }: LoginProps) {
  const [isJoin, setIsJoin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage('Account created successfully! You can now sign in.');
        setIsJoin(false);
        setEmail('');
        setPassword('');
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
        <h1>See New York</h1>
        <p className="login-subtitle">
          Track and analyze service gaps across New York City
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isJoin ? 'Join' : 'Sign In'}</h2>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

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

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Loading...' : isJoin ? 'Join' : 'Sign In'}
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
              {isJoin ? 'Sign In' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
