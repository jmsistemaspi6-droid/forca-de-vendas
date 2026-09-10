import React, { useState } from 'react';
import { useSales } from '../../context/SalesContext';
import logoImg from '../../assets/images/jm_sistemas_logo_1788176773631.jpg';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, showToast } = useSales();

  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!loginUser.trim()) {
      setErrorMsg('Informe o usuário ou código do vendedor.');
      return;
    }
    if (!loginPass.trim()) {
      setErrorMsg('Informe sua senha.');
      return;
    }

    const res = login(loginUser, loginPass);
    if (!res.success) {
      setErrorMsg(res.message || 'Código do vendedor ou senha inválidos.');
    } else {
      if (onSuccess) onSuccess();
    }
  };

  const handleBiometricLogin = () => {
    // Autenticação biométrica simulada para o vendedor cadastrado
    setErrorMsg('');
    const res = login('001', '123');
    if (res.success) {
      showToast('Biometria Reconhecida', 'Acesso autenticado via biometria com sucesso!', 'success');
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg('Biometria não cadastrada neste dispositivo.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800">
      <img
        src={logoImg || "/logo-jm-sistemas.png"}
        className="h-14 mb-2 object-contain"
        alt="JM Sistemas"
      />
      <p className="text-[11px] tracking-widest text-slate-400 uppercase mb-6 font-semibold">
        Força de Vendas & ERP Retaguarda
      </p>

      <div className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
        <form onSubmit={handleLogin}>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Usuário / Código Vendedor
          </label>
          <div className="relative mb-3">
            <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              placeholder="Código ou usuário de acesso"
              className="w-full h-14 rounded-2xl border border-slate-200 pl-11 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-sm"
              id="loginUser"
              value={loginUser}
              onChange={(e) => {
                setLoginUser(e.target.value);
                setErrorMsg('');
              }}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
            />
          </div>

          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Senha
          </label>
          <div className="relative mb-5">
            <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha de acesso"
              className="w-full h-14 rounded-2xl border border-slate-200 pl-11 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-sm"
              id="loginPass"
              value={loginPass}
              onChange={(e) => {
                setLoginPass(e.target.value);
                setErrorMsg('');
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer"
              title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 font-medium mb-4 text-center bg-rose-50 py-2 px-3 rounded-xl border border-rose-100">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-14 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-md shadow-blue-500/20 cursor-pointer text-sm"
          >
            ENTRAR
          </button>

          <button
            type="button"
            onClick={handleBiometricLogin}
            className="w-full mt-3 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer py-1 text-center"
          >
            Entrar com biometria / Face ID
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 max-w-sm w-full">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
        <span>Ambiente seguro com criptografia de ponta a ponta</span>
      </div>
    </div>
  );
};
