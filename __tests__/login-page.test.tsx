import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/lib/useAuth';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/useAuth', () => ({
  useAuthUser: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('LoginPage', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useAuthUser as jest.Mock).mockReturnValue({ isAuthenticated: false, status: 'unauthenticated' });
  });

  it('renders login form inputs and button', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits credentials and redirects when signIn succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { _id: 'abc', email: 'test@example.com', name: 'Test', telephone: '0123456789', role: 'user' }, token: 'jwt-token' }),
    });

    (signIn as jest.Mock).mockResolvedValue({ ok: true });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'test123' } });
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ email: 'test@example.com', accessToken: 'jwt-token', redirect: false }));
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
  });

  it('does not redirect when login fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'badpass' } });
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled();
      expect(signIn).not.toHaveBeenCalled();
    });
  });

  it('registers new user and redirects when registration succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { _id: 'abc', email: 'register@example.com', name: 'RegTest', telephone: '0123456789', role: 'user' }, token: 'jwt-token' }),
    });

    (signIn as jest.Mock).mockResolvedValue({ ok: true });

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'RegTest' } });
    fireEvent.change(screen.getByPlaceholderText('0xx-xxx-xxxx'), { target: { value: '0123456789' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'register@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Min. 6 characters'), { target: { value: 'test123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: 'test123' } });

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
      expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ email: 'register@example.com', accessToken: 'jwt-token', redirect: false }));
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  }, 15000);
});
