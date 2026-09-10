import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  KeyRound,
  Sparkles,
  Building2,
  Users,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { SystemUser } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    login,
    isLoginModalOpen,
    setIsLoginModalOpen,
    setIsCadastroEmpresaOpen,
    switchUser,
  } = useSales();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'master' | 'vendedores'>('master');

  const visible = isOpen !== undefined ? isOpen : isLoginModalOpen;

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(email, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao realizar login');
    } else {
      if (onClose) onClose();
      setIsLoginModalOpen(false);
    }
  };

  const handleSelectMaster = () => {
    setEmail('master');
    setPassword('');
    setErrorMsg('');
  };

  const handleSelectSeller = (sellerUser: SystemUser) => {
    setEmail(sellerUser.email || sellerUser.codigoVendedor);
    setPassword('');
    setErrorMsg('');
  };

  const sellersList = users.filter((u) => u.role === 'VENDEDOR' || u.role === 'GERENTE_VENDAS');
  const masterUser = users.find((u) => u.role === 'ADMIN_MASTER');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative my-8">
        {currentUser && (
          <button
            onClick={() => {
              if (onClose) onClose();
              setIsLoginModalOpen(false);
            }}
            className="absolute right-5 top-5 z-10 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-6 border-b border-slate-700/80 text-white relative">
          <div className="flex items-center gap-3">
            <BrandLogo size="lg" />
            <div className="border-l border-slate-700/80 pl-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  ERP & FORÇA DE VENDAS
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Acesso unificado à Retaguarda Desktop e Força de Vendas Mobile
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for Login Type */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/50 p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('master');
              handleSelectMaster();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'master'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>👑 Master Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vendedores')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vendedores'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>📱 Força de Vendas</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick 1-Click Profile Selectors */}
          {activeTab === 'master' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-800/60 to-blue-500/10 border border-amber-500/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg font-bold">
                    👑
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">
                        Acesso Master com Senha Master
                      </h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        MASTER PASS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Direito a <strong>acesso a todos os módulos do sistema</strong> (Retaguarda ERP, XML, Finanças, Estoque e Mobile).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSelectMaster}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold shrink-0 transition-colors"
                >
                  Preencher
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">
                  Usuário Master: <strong className="text-slate-100 font-mono">master</strong> ou <strong className="text-slate-100 font-mono">novo@jmsistemaspi.com</strong>
                </span>
                <span className="text-amber-400/90 text-[11px] font-medium flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Autenticação restrita à administração</span>
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Selecione o Vendedor:</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {sellersList.length} vendedores disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {sellersList.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSeller(s)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      String(email || '').toLowerCase() === String(s.email || '').toLowerCase()
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={s.fotoUrl}
                        alt={s.nome}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">{s.nome}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {s.codigoVendedor} • {s.regiao?.split('&')[0]}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-medium">
                      Selecionar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail / Usuário de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: master ou vendedor@jmsistemas.com"
                  required
                  autoComplete="username"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha de Acesso
                </label>
                <span className="text-[10px] text-slate-400">
                  (Digite sua senha pessoal)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha..."
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <X className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Entrar no Sistema</span>
            </button>
          </form>

          {/* Quick Help Footer */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ambiente Protegido • Senhas Criptografadas</span>
            </span>
            <span className="text-slate-500">
              JM Sistemas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
