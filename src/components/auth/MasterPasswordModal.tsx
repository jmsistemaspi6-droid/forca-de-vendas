import React, { useState } from 'react';
import { ShieldAlert, KeyRound, CheckCircle2, X, Lock, Eye, EyeOff } from 'lucide-react';
import { useSales } from '../../context/SalesContext';

export const MasterPasswordModal: React.FC = () => {
  const {
    isMasterUnlockModalOpen,
    setIsMasterUnlockModalOpen,
    verifyMasterPassword,
    showToast,
    unlockRetaguarda,
  } = useSales();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isMasterUnlockModalOpen) return null;

  const handleClose = () => {
    setIsMasterUnlockModalOpen(false);
    setPassword('');
    setError(false);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyMasterPassword(password)) {
      setError(false);
      handleClose();
      unlockRetaguarda();
      showToast(
        'Acesso Retaguarda Liberado',
        'Senha master validada com sucesso! Bem-vindo(a) à Retaguarda ERP.',
        'success'
      );
    } else {
      setError(true);
      showToast('Senha Incorreta', 'A senha master informada não é válida.', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Autorização com Senha Master
            </h3>
            <p className="text-xs text-slate-400">
              Módulo restrito à administração da empresa
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 leading-relaxed">
          Para acessar as configurações, financeiro, XML e relatórios da <strong className="text-blue-400">Retaguarda ERP</strong>, digite a <strong>Senha Master</strong> cadastrada.
        </p>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Senha Master de Acesso
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Digite a senha master..."
                autoFocus
                autoComplete="current-password"
                className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-700 focus:ring-amber-500/30 focus:border-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                Senha master incorreta. Verifique os dados digitados.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Desbloquear Retaguarda</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
