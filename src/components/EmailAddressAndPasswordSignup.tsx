```typescript
/**
 * EmailAddressAndPasswordSignup component handles user sign up with email address and password.
 */

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ZustandStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

interface FormData {
  email: string;
  password: string;
}

const EmailAddressAndPasswordSignup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useMutation(
    async (data: FormData) => {
      // Add your actual signup API call here
      // This is a placeholder
      return fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    {
      onSuccess: () => {
        navigate('/login');
      },
    }
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await signup.mutateAsync(data);
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-4 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4">Sign up</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className={`block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
            {...register('email')}
          />
          {errors.email && <div className="text-red-500 mt-2">{errors.email.message}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 ${errors.password ? 'border-red-500' : ''}`}
            {...register('password')}
          />
          {errors.password && <div className="text-red-500 mt-2">{errors.password.message}</div>}
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
        >
          Sign up
        </button>
      </form>
      <p className="mt-4 text-gray-700 text-sm">
        Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-700">Log in</Link>
      </p>
    </div>
  );
};

export default EmailAddressAndPasswordSignup;
```