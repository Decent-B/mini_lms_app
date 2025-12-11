import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import type { LoginCredentials, AuthResponse } from '../types';

export default function Login(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to admin if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'staff') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const credentials: LoginCredentials = { email, password };
      const response = await api.post<AuthResponse>('/api/auth/login', credentials);
      
      const { access_token, user } = response.data;
      
      // Check if user has staff role
      if (user.role !== 'staff') {
        setError('Access denied. Only staff members can login to this portal.');
        setIsLoading(false);
        return;
      }
      
      login(access_token, user);
      
      // Navigate to admin panel
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="h-screen bg-neutral-200 dark:bg-neutral-700">
      <div className="container mx-auto h-full p-10">
        <div className="flex h-full flex-wrap items-center justify-center text-neutral-800 dark:text-neutral-200">
          <div className="w-full max-w-5xl">
            <div className="block rounded-lg bg-white shadow-lg dark:bg-neutral-800">
              <div className="lg:flex lg:flex-wrap">
                {/* Left column container */}
                <div className="px-4 md:px-0 lg:w-6/12">
                  <div className="md:mx-6 md:p-12">
                    {/* Logo */}
                    <div className="text-center">
                      <img
                        className="mx-auto w-48"
                        src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/lotus.webp"
                        alt="logo"
                      />
                      <h4 className="mb-12 mt-1 pb-1 text-xl font-semibold">
                        Mini LMS Portal
                      </h4>
                    </div>

                    <form onSubmit={handleLogin}>
                      <p className="mb-4">Please login to your account</p>
                      
                      {error && (
                        <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
                          {error}
                        </div>
                      )}

                      {/* Email input */}
                      <div className="mb-4">
                        <input
                          type="email"
                          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      {/* Password input */}
                      <div className="mb-4">
                        <input
                          type="password"
                          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>

                      {/* Submit button */}
                      <div className="mb-12 pb-1 pt-1 text-center">
                        <button
                          className="mb-3 w-full rounded px-6 py-2.5 text-xs font-medium uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg disabled:opacity-50"
                          type="submit"
                          disabled={isLoading}
                          style={{
                            background:
                              'linear-gradient(to right, #ee7724, #d8363a, #dd3675, #b44593)',
                          }}
                        >
                          {isLoading ? 'Logging in...' : 'Log in'}
                        </button>

                        {/* Forgot password link */}
                        <a href="#!" className="text-sm text-gray-600 hover:underline">
                          Forgot password?
                        </a>
                      </div>

                      {/* Register button */}
                      <div className="flex items-center justify-between pb-6">
                        <p className="mb-0 mr-2">Don't have an account?</p>
                        <button
                          type="button"
                          className="inline-block rounded border-2 border-red-600 px-6 py-2 text-xs font-medium uppercase leading-normal text-red-600 transition duration-150 ease-in-out hover:border-red-700 hover:bg-red-50 hover:text-red-700 focus:border-red-700 focus:text-red-700 focus:outline-none focus:ring-0 active:border-red-800 active:text-red-800"
                          onClick={() => navigate('/register')}
                        >
                          Register
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right column container with background and description */}
                <div
                  className="flex items-center rounded-b-lg lg:w-6/12 lg:rounded-r-lg lg:rounded-bl-none"
                  style={{
                    background:
                      'linear-gradient(to right, #ee7724, #d8363a, #dd3675, #b44593)',
                  }}
                >
                  <div className="px-4 py-6 text-white md:mx-6 md:p-12">
                    <h4 className="mb-6 text-xl font-semibold">
                      Welcome to Mini LMS
                    </h4>
                    <p className="text-sm">
                      Our Learning Management System provides a comprehensive platform
                      for students, parents, and staff to manage classes, track progress,
                      and stay connected. Access your dashboard to view class schedules,
                      manage subscriptions, and monitor learning activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
