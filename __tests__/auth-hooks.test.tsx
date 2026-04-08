import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSignOut } from '@/lib/useAuth';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}));

function TestSignOutButton() {
  const signOut = useSignOut();
  return (
    <button onClick={signOut}>
      Logout
    </button>
  );
}

describe('useSignOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls backend logout endpoint and signs out via next-auth', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'u1' }, accessToken: 'jwt-token' },
      status: 'authenticated',
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<TestSignOutButton />);

    await userEvent.click(screen.getByRole('button', { name: /logout/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer jwt-token',
        },
      });

      expect(nextAuthSignOut).toHaveBeenCalledWith({ redirect: false });
    });
  });
});
