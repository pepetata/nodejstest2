import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import userService from '../../services/userService';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // 'pending', 'success', 'expired', 'error', 'alreadyConfirmed'
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [allowResend, setAllowResend] = useState(false);
  const hasConfirmed = useRef(false); // Use ref to prevent double request

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de confirmação ausente.');
      return;
    }
    if (hasConfirmed.current) return; // Prevent double request
    hasConfirmed.current = true;
    userService
      .confirmEmail(token)
      .then((res) => {
        const data = res.data;
        if (data?.data?.alreadyConfirmed) {
          setStatus('alreadyConfirmed');
          setMessage('Seu e-mail já está confirmado! Faça login com suas credenciais.');
          // Remove auto-redirect, show button instead
        } else {
          setStatus('success');
          setMessage(
            'E-mail confirmado com sucesso! Seja bem-vindo ao À La Carte. Agora você pode fazer login com suas credenciais.'
          );
          // Remove auto-redirect, show button instead
        }
      })
      .catch((err) => {
        const backend = err?.response?.data;
        if (
          backend?.error?.details?.allowResend ||
          backend?.error?.message?.toLowerCase().includes('expirou') ||
          backend?.error?.message?.toLowerCase().includes('inválido')
        ) {
          setStatus('expired');
          setAllowResend(true);
          setMessage(
            backend?.error?.message ||
              'O link de confirmação expirou ou é inválido. Você pode solicitar um novo e-mail de confirmação.'
          );
        } else {
          setStatus('error');
          setMessage(backend?.error?.message || 'Erro ao confirmar o e-mail.');
        }
      });
  }, [token, navigate]); // Do NOT include hasConfirmed in deps

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      await userService.resendConfirmation({ token });
      setResent(true);
      setMessage('Novo e-mail de confirmação enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Erro ao reenviar o e-mail de confirmação.');
    }
    setResending(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Confirmação de E-mail</h2>
        <p className="mb-6 text-gray-700">{message}</p>
        {status === 'expired' && allowResend && (
          <button className="standard-btn" onClick={handleResend} disabled={resending}>
            {resending ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
          </button>
        )}
        {resent && <p className="mt-4 text-green-600">E-mail reenviado com sucesso!</p>}
        {(status === 'success' || status === 'alreadyConfirmed') && (
          <button
            className="mt-4 standard-btn"
            onClick={() => navigate('/login', { replace: true })}
          >
            Ir para o Login
          </button>
        )}
      </div>
    </div>
  );
}
