import { useEffect } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { InferRequestType } from 'hono/client';

import { APIError, api, setRawToken, getRawToken } from '../lib/api';

export const Login = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (getRawToken()) {
      toast.info('You are already logged in');
      navigate('/');
    }
  }, [navigate]);
  const { mutateAsync } = useMutation((credentials: { username: string; password: string }) =>
    api.login.$post({ json: credentials }).then((res) => res.json()),
  );
  const { register, handleSubmit } = useForm<InferRequestType<typeof api.login.$post>['json']>({
    defaultValues: {
      username: '',
      password: '',
    },
  });
  return (
    <div className="flex justify-center items-center h-screen">
      <form
        className="w-64"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(async (credentials) => {
          let token: string | undefined;
          try {
            token = await mutateAsync(credentials);
          } catch (error) {
            if (error instanceof APIError) {
              toast.error(error.message);
            } else {
              toast.error('Unknown error');
            }
          }
          if (token) {
            toast.success('Login successful');
            setRawToken(token);
            navigate('/');
          }
        })}
      >
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <input
          type="text"
          placeholder="Username"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
          required
          {...register('username')}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
          required
          {...register('password')}
        />
        <button type="submit" className="w-full bg-blue-500 text-white rounded py-2">
          Login
        </button>
      </form>
    </div>
  );
};
