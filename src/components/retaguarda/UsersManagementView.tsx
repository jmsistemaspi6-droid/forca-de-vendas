import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Smartphone,
  KeyRound,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Building2,
  Award,
  TrendingUp,
  LogIn,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { useSales } from '../../context/SalesContext';
import { SystemUser, UserRole } from '../../types';
import { UserFormModal } from './UserFormModal';
import { VoiceSearchButton } from '../common/VoiceSearchButton';
import { MASTER_ADMIN_CREDENTIALS } from '../../data/mockData';

export const UsersManagementView: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    switchUser,
    showToast,
    isMasterAdmin,
  } = useSales();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | UserRole>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'bloqueado'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const term = (searchTerm || '').toLowerCase().trim();
    const nome = String(u.nome || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const codVend = String(u.codigoVendedor || '').toLowerCase();
    const regiao = String(u.regiao || '').toLowerCase();
    const cargo = String(u.cargo || '').toLowerCase();

    const matchSearch =
      !term ||
      nome.includes(term) ||
      email.includes(term) ||
      codVend.includes(term) ||
      regiao.includes(term) ||
      cargo.includes(term);

    const matchRole = roleFilter === 'todos' || u.role === roleFilter;
    const matchStatus = statusFilter === 'todos' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // Calculate metrics
  const activeSellers = users.filter((u) => u.role === 'VENDEDOR' && u.status === 'ativo');
  const totalTeamMonthlyGoal = users.reduce((acc, u) => acc + (u.metaMensal || 0), 0);
  const avgCommission =
    users.filter((u) => u.role === 'VENDEDOR').reduce((acc, u) => acc + (u.comissaoPadraoPct || 0), 0) /
    (activeSellers.length || 1);

  const handleCopyCredentials = (user: SystemUser) => {
    const text = `Acesso Força de Vendas / ERP:\nUsuário: ${user.email}\nSenha: ${user.senha || '123456'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    showToast('Credenciais Copiadas', `Login e senha de ${user.nome} copiados para a área de transferência.`, 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyMasterCredentials = () => {
    const text = `Acesso Master Administrativo:\nUsuário: novo@jmsistemaspi.com\nAmbiente Restrito`;
    navigator.clipboard.writeText(text);
    setCopiedId('master-creds');
    showToast('Credenciais Copiadas', 'E-mail do usuário master copiado com sucesso.', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleStatus = (user: SystemUser) => {
    const nextStatus = user.status === 'ativo' ? 'bloqueado' : 'ativo';
    updateUser(user.id, { status: nextStatus });
  };

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (userData: Omit<SystemUser, 'id' | 'dataCadastro'>) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
  };

  const handleDeleteUser = (user: SystemUser) => {
    if (user.role === 'ADMIN_MASTER') {
      showToast('Ação Não Permitida', 'Não é possível excluir o Administrador Master.', 'error');
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o cadastro do vendedor ${user.nome}?`)) {
      deleteUser(user.id);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">
                Cadastros de Vendedores & Usuários
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                FORÇA DE VENDAS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie os logins, senhas, comissões, metas e permissões de acesso ao sistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNewUser}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Vendedor</span>
          </button>
        </div>
      </div>

      {/* Master Admin Card Highlight */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-blue-950/40 border border-amber-500/40 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Acesso Desktop com Senha Master (Direito a Todos os Módulos)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ADMIN MASTER
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Conta principal com acesso irrestrito a cadastros, notas fiscais, finanças, estoque e retaguarda completa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Usuário:</span>
              <strong className="text-blue-300 font-mono">novo@jmsistemaspi.com</strong>
            </div>

            <div className="h-4 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Senha Master:</span>
              <strong className="text-amber-300 font-mono">•••••••• (Protegida)</strong>
            </div>

            <button
              onClick={handleCopyMasterCredentials}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors ml-auto"
              title="Copiar dados de login master"
            >
              {copiedId === 'master-creds' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Vendedores Ativos
            </p>
            <h3 className="text-2xl font-black text-slate-100 mt-1">
              {activeSellers.length}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-0.5">
              Equipe externa habilitada
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Meta Total da Equipe
            </p>
            <h3 className="text-2xl font-black text-slate-100 mt-1">
              R$ {totalTeamMonthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </h3>
            <p className="text-[11px] text-blue-400 mt-0.5">
              Meta de faturamento mensal
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Comissão Média
            </p>
            <h3 className="text-2xl font-black text-slate-100 mt-1">
              {avgCommission.toFixed(1)}%
            </h3>
            <p className="text-[11px] text-purple-400 mt-0.5">
              Remuneração por venda
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Usuário Atual
            </p>
            <h3 className="text-sm font-bold text-slate-100 mt-1 truncate max-w-[150px]">
              {currentUser?.nome || 'Não Logado'}
            </h3>
            <p className="text-[11px] text-amber-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentUser?.role === 'ADMIN_MASTER' ? 'Acesso Master' : 'Vendedor'}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input with Voice Search */}
        <div className="relative w-full md:w-96 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail, código ou região..."
            className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceSearchButton
              onTranscript={(text) => setSearchTerm(text)}
              size="sm"
              placeholderHint="Diga o nome do vendedor ou região..."
              title="Pesquisar Vendedor por Voz"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setRoleFilter('todos')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                roleFilter === 'todos'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('VENDEDOR')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                roleFilter === 'VENDEDOR'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vendedores ({users.filter((u) => u.role === 'VENDEDOR').length})
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN_MASTER')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                roleFilter === 'ADMIN_MASTER'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Master ({users.filter((u) => u.role === 'ADMIN_MASTER').length})
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Status: Todos</option>
            <option value="ativo">🟢 Apenas Ativos</option>
            <option value="bloqueado">🔴 Apenas Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isRevealed = revealedPasswords[user.id];
          const isLoggedThisUser = currentUser?.id === user.id;

          return (
            <div
              key={user.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between shadow-lg relative transition-all hover:border-slate-600 ${
                user.role === 'ADMIN_MASTER'
                  ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 to-amber-950/20'
                  : isLoggedThisUser
                  ? 'border-blue-500/50 bg-blue-950/10'
                  : 'border-slate-800'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                      alt={user.nome}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100 leading-tight">
                          {user.nome}
                        </h3>
                        {isLoggedThisUser && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{user.cargo || 'Vendedor'}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      user.role === 'ADMIN_MASTER'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : user.role === 'GERENTE_VENDAS'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {user.role === 'ADMIN_MASTER'
                      ? '👑 Master'
                      : user.role === 'GERENTE_VENDAS'
                      ? '👔 Gerente'
                      : '📱 Vendedor'}
                  </span>
                </div>

                {/* Info Block */}
                <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs">
                  {/* Login email */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Usuário (Login):</span>
                    </span>
                    <span className="font-mono text-slate-200 font-semibold truncate max-w-[170px]" title={user.email}>
                      {user.email}
                    </span>
                  </div>

                  {/* Password row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Senha de Acesso:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-amber-300 font-bold">
                        {isRevealed ? user.senha || '123456' : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordReveal(user.id)}
                        className="text-slate-400 hover:text-slate-200 p-0.5"
                        title={isRevealed ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopyCredentials(user)}
                        className="text-slate-400 hover:text-slate-200 p-0.5"
                        title="Copiar usuário e senha"
                      >
                        {copiedId === user.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code & Region */}
                  {user.codigoVendedor && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[11px]">Código:</span>
                      <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900">
                        {user.codigoVendedor}
                      </span>
                    </div>
                  )}

                  {user.telefone && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Telefone:</span>
                      </span>
                      <span className="text-slate-300 font-medium">{user.telefone}</span>
                    </div>
                  )}

                  {user.regiao && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>Região:</span>
                      </span>
                      <span className="text-slate-300 truncate max-w-[170px]" title={user.regiao}>
                        {user.regiao}
                      </span>
                    </div>
                  )}

                  {/* Commercial targets */}
                  {user.role === 'VENDEDOR' && (
                    <div className="pt-2 flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border border-slate-800">
                      <div>
                        <p className="text-[10px] text-slate-400">Meta Mensal</p>
                        <p className="text-xs font-bold text-emerald-400">
                          R$ {(user.metaMensal || 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Comissão</p>
                        <p className="text-xs font-bold text-blue-400">
                          {user.comissaoPadraoPct || 4.5}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status and Last access */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.status === 'ativo' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="capitalize">{user.status}</span>
                  </div>
                  <span>Acesso: {user.ultimoAcesso || 'Nunca'}</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => switchUser(user.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    isLoggedThisUser
                      ? 'bg-slate-800 text-slate-300 cursor-default'
                      : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                  }`}
                  title="Simular e testar o Força de Vendas com este vendedor"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isLoggedThisUser ? 'Conta Ativa' : 'Testar Login'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditUser(user)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Editar Cadastro e Permissões"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {user.role !== 'ADMIN_MASTER' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.status === 'ativo'
                            ? 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700'
                            : 'bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800'
                        }`}
                        title={user.status === 'ativo' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                      >
                        {user.status === 'ativo' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                        title="Excluir Vendedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum vendedor ou usuário encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tente buscar com outros termos ou cadastre um novo vendedor no botão acima.
          </p>
          <button
            onClick={handleOpenNewUser}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Vendedor</span>
          </button>
        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />
    </div>
  );
};
