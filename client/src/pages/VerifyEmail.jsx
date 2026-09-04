import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState(false);
  const requestStarted = useRef(false);

  useEffect(() => {
    if (requestStarted.current) return;
    requestStarted.current = true;

    api.get(`/auth/verify-email/${token}`)
      .then((response) => setMessage(response.data.message))
      .catch((requestError) => {
        setError(true);
        setMessage(requestError.response?.data?.message || 'Unable to verify this email.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Email Verification</h1>
        <p className={error ? 'text-red-600 mb-6' : 'text-gray-600 mb-6'}>{message}</p>
        <Link to="/login" className="inline-block bg-textile-600 hover:bg-textile-700 text-white font-medium py-2.5 px-5 rounded-lg">Go to Sign In</Link>
      </div>
    </div>
  );
}