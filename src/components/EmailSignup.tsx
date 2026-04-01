/**
 * EmailSignup component: Handles email signup process for new users.
 */
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSignupMutation } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().refine((val, ctx) => val === ctx.parent.password, {
    message: 'Passwords do not match',
  }),
});

type SignupForm = z.infer<typeof schema>;

const EmailSignup = () => {
  const navigate = useNavigate();
  const { mutate, isLoading } = useSignupMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<SignupForm> = async (data) => {
    try {
      await mutate({ email: data.email, password: data.password });
      navigate('/login');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10 border border-gray-300 rounded">
      <h2 className="text-lg font-bold mb-4">Sign up with email</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`block w-full p-2 border border-gray-300 rounded ${
              errors.email && 'border-red-500'
            }`}
            {...register('email')}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`block w-full p-2 border border-gray-300 rounded ${
              errors.password && 'border-red-500'
            }`}
            {...register('password')}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            className={`block w-full p-2 border border-gray-300 rounded ${
              errors.confirmPassword && 'border-red-500'
            }`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
    </div>
  );
};

export default EmailSignup;