import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  DollarSign,
  Percent,
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { SystemUser, UserRole, UserPermissions } from '../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Omit<SystemUser, 'id' | 'dataCadastro'>) => void;
  editingUser?: SystemUser | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('123456');
  const [showSenha, setShowSenha] = useState(false);
  const [role, setRole] = useState<UserRole>('VENDEDOR');
  const [cargo, setCargo] = useState('Executivo de Vendas Campo');
  const [codigoVendedor, setCodigoVendedor] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [regiao, setRegiao] = useState('');
  const [comissaoPadraoPct, setComissaoPadraoPct] = useState<number>(4.5);
  const [metaMensal, setMetaMensal] = useState<number>(100000);
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'bloqueado'>('ativo');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250');

  // Permissões
  const [permissoes, setPermissoes] = useState<UserPermissions>({
    acessoDesktopRetaguarda: false,
    acessoForcaVendas: true,
    emitirPedidos: true,
    verFinanceiroCompleto: false,
    importarXml: false,
    cadastrarUsuarios: false,
    alterarTabelaPrecos: false,
    darDescontoEspecial: false,
  });

  useEffect(() => {
    if (editingUser) {
      setNome(editingUser.nome);
      setEmail(editingUser.email);
      setSenha(editingUser.senha || '123456');
      setRole(editingUser.role);
      setCargo(editingUser.cargo || 'Vendedor');
      setCodigoVendedor(editingUser.codigoVendedor || '');
      setTelefone(editingUser.telefone || '');
      setCpf(editingUser.cpf || '');
      setRegiao(editingUser.regiao || '');
      setComissaoPadraoPct(editingUser.comissaoPadraoPct || 4.5);
      setMetaMensal(editingUser.metaMensal || 100000);
      setStatus(editingUser.status || 'ativo');
      setFotoUrl(editingUser.fotoUrl || '');
      setPermissoes(
        editingUser.permissoes || {
          acessoDesktopRetaguarda: editingUser.role === 'ADMIN_MASTER',
          acessoForcaVendas: true,
          emitirPedidos: true,
          verFinanceiroCompleto: editingUser.role === 'ADMIN_MASTER',
          importarXml: editingUser.role === 'ADMIN_MASTER',
          cadastrarUsuarios: editingUser.role === 'ADMIN_MASTER',
          alterarTabelaPrecos: editingUser.role === 'ADMIN_MASTER',
          darDescontoEspecial: false,
        }
      );
    } else {
      // Defaults for new seller
      const randomCode = `VEND-${Math.floor(100 + Math.random() * 900)}`;
      setNome('');
      setEmail('');
      setSenha('123456');
      setRole('VENDEDOR');
      setCargo('Vendedor Externo Campo - B2B');
      setCodigoVendedor(randomCode);
      setTelefone('(11) 98000-0000');
      setCpf('');
      setRegiao('São Paulo / Capital & Região Metropolitana');
      setComissaoPadraoPct(4.5);
      setMetaMensal(120000);
      setStatus('ativo');
      setFotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250');
      setPermissoes({
        acessoDesktopRetaguarda: false,
        acessoForcaVendas: true,
        emitirPedidos: true,
        verFinanceiroCompleto: false,
        importarXml: false,
        cadastrarUsuarios: false,
        alterarTabelaPrecos: false,
        darDescontoEspecial: false,
      });
    }
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'ADMIN_MASTER') {
      setCargo('Administrador Master / Diretor');
      setPermissoes({
        acessoDesktopRetaguarda: true,
        acessoForcaVendas: true,
        emitirPedidos: true,
        verFinanceiroCompleto: true,
        importarXml: true,
        cadastrarUsuarios: true,
        alterarTabelaPrecos: true,
        darDescontoEspecial: true,
      });
    } else if (newRole === 'GERENTE_VENDAS') {
      setCargo('Supervisor Regional de Vendas');
      setPermissoes({
        acessoDesktopRetaguarda: true,
        acessoForcaVendas: true,
        emitirPedidos: true,
        verFinanceiroCompleto: true,
        importarXml: true,
        cadastrarUsuarios: false,
        alterarTabelaPrecos: true,
        darDescontoEspecial: true,
      });
    } else {
      setCargo('Executivo de Vendas Campo');
      setPermissoes({
        acessoDesktopRetaguarda: false,
        acessoForcaVendas: true,
        emitirPedidos: true,
        verFinanceiroCompleto: false,
        importarXml: false,
        cadastrarUsuarios: false,
        alterarTabelaPrecos: false,
        darDescontoEspecial: false,
      });
    }
  };

  const handleGeneratePassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(res);
    setShowSenha(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    onSave({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha: senha.trim(),
      role,
      cargo: cargo.trim(),
      codigoVendedor: codigoVendedor.trim() || `VEND-${Math.floor(100 + Math.random() * 900)}`,
      telefone: telefone.trim(),
      cpf: cpf.trim(),
      fotoUrl: fotoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      regiao: regiao.trim(),
      comissaoPadraoPct: Number(comissaoPadraoPct) || 0,
      metaMensal: Number(metaMensal) || 0,
      status,
      permissoes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {editingUser ? 'Editar Cadastro do Vendedor / Usuário' : 'Novo Vendedor / Usuário do Força de Vendas'}
            </h3>
            <p className="text-xs text-slate-400">
              Defina as credenciais de acesso, metas comerciais e permissões no sistema
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleRoleChange('VENDEDOR')}
              className={`p-3 rounded-xl border text-center transition-all ${
                role === 'VENDEDOR'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <div className="text-xs">Vendedor Campo</div>
              <div className="text-[10px] text-slate-400 font-normal">Força de Vendas</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('GERENTE_VENDAS')}
              className={`p-3 rounded-xl border text-center transition-all ${
                role === 'GERENTE_VENDAS'
                  ? 'bg-blue-950/60 border-blue-500 text-blue-300 font-bold shadow-sm'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <div className="text-xs">Supervisor / Gerente</div>
              <div className="text-[10px] text-slate-400 font-normal">Equipe e Vendas</div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN_MASTER')}
              className={`p-3 rounded-xl border text-center transition-all ${
                role === 'ADMIN_MASTER'
                  ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold shadow-sm'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <div className="text-xs">Administrador Master</div>
              <div className="text-[10px] text-slate-400 font-normal">Acesso Irrestrito</div>
            </button>
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome Completo do Vendedor *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail (Login de Acesso) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: vendedor@jmsistemas.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Senha e Código */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha de Acesso *
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Gerar Aleatória
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha do vendedor..."
                  required
                  className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código do Vendedor (Identificador)
              </label>
              <input
                type="text"
                value={codigoVendedor}
                onChange={(e) => setCodigoVendedor(e.target.value)}
                placeholder="Ex: VEND-842"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Telefone e Região */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(86) 99999-9999"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Região / Rota de Atuação
              </label>
              <input
                type="text"
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
                placeholder="Ex: Grande São Paulo, Piauí & Maranhão..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Metas e Comissão */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meta Mensal (R$)
              </label>
              <div className="relative">
                <span className="text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">R$</span>
                <input
                  type="number"
                  value={metaMensal}
                  onChange={(e) => setMetaMensal(Number(e.target.value))}
                  min="0"
                  step="1000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Comissão Padrão (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={comissaoPadraoPct}
                  onChange={(e) => setComissaoPadraoPct(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status da Conta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="ativo">🟢 Ativo (Acesso Liberado)</option>
                <option value="bloqueado">🔴 Bloqueado</option>
                <option value="inativo">⚪ Inativo</option>
              </select>
            </div>
          </div>

          {/* Permissões Especiais */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200">Permissões de Acesso do Vendedor:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.acessoDesktopRetaguarda}
                  onChange={(e) =>
                    setPermissoes({ ...permissoes, acessoDesktopRetaguarda: e.target.checked })
                  }
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Acessar Retaguarda ERP Desktop</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.acessoForcaVendas}
                  onChange={(e) =>
                    setPermissoes({ ...permissoes, acessoForcaVendas: e.target.checked })
                  }
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Acessar Força de Vendas Mobile</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.verFinanceiroCompleto}
                  onChange={(e) =>
                    setPermissoes({ ...permissoes, verFinanceiroCompleto: e.target.checked })
                  }
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Ver Financeiro Geral / DRE</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.darDescontoEspecial}
                  onChange={(e) =>
                    setPermissoes({ ...permissoes, darDescontoEspecial: e.target.checked })
                  }
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Autorizar Descontos Especiais</span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingUser ? 'Salvar Alterações' : 'Cadastrar Vendedor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
