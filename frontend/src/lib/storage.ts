const TOKEN_KEY = 'cims_token';
const USER_KEY = 'cims_user';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
};
