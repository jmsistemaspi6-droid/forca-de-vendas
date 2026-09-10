import React from 'react';

interface AdminAccessProps {
  onOpenDesktop: () => void;
}

export const AdminAccess: React.FC<AdminAccessProps> = ({ onOpenDesktop }) => {
  return (
    <div id="adminAccess" className="mt-6 p-4 bg-slate-900 rounded-[20px] flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-lg">
          💻
        </div>
        <div>
          <p className="text-white font-bold text-sm">Versão Desktop</p>
          <p className="text-white/60 text-xs">Acesso retaguarda</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenDesktop}
        className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition-all cursor-pointer shadow-xs"
      >
        Entrar
      </button>
    </div>
  );
};
