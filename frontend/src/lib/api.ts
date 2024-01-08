import type { App } from '../../../backend/src';

import { toast } from 'sonner';
import { hc, InferRequestType, InferResponseType } from 'hono/client';

type Session = InferResponseType<typeof api.me.$get>;

const token: {
  raw: string | null;
  decoded: Session | null;
} = {
  raw: null,
  decoded: null,
};

export const getRawToken = () => token.raw;

export const decodeToken = (rawToken: string) => {
  if (!rawToken) throw new Error('No token');
  const payload = rawToken.split('.')?.[1];
  if (!payload) throw new Error('Invalid token');
  return JSON.parse(atob(payload)) as Session;
};

export const getDecodedToken = () => token.decoded;

export const setRawToken = (newToken: string | null) => {
  token.raw = newToken;
  token.decoded = newToken ? decodeToken(newToken) : null;
  if (newToken) localStorage.setItem('token', newToken);
  else localStorage.removeItem('token');
};

setRawToken(localStorage.getItem('token'));

export class APIError extends Error {
  name: string;

  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = `APIError(${status})`;
    this.status = status;
  }
}

const fancyFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const currentToken = getRawToken();
  if (currentToken) request.headers.set('Authorization', `Bearer ${currentToken}`);
  const response = await fetch(request);
  if (!response.ok) {
    // eslint-disable-next-line no-underscore-dangle
    if (response.status === 401 && window.__router) {
      toast.info('Please login to continue');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises, no-underscore-dangle
      window.__router.navigate('/login');
    }
    throw new APIError((await response.text()) || 'Unknown', response.status);
  }
  return response;
};

export const api = hc<App>('/api', {
  fetch: fancyFetch,
});
