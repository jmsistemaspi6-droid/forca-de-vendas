import React from 'react';
import logoImg from '../../assets/images/jm_sistemas_logo_1788176773631.jpg';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  showText = true,
  variant = 'auto',
  className = '',
}) => {
  const sizeMap = {
    sm: { img: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]' },
    md: { img: 'w-9 h-9', text: 'text-sm', sub: 'text-[10px]' },
    lg: { img: 'w-11 h-11', text: 'text-base', sub: 'text-xs' },
    xl: { img: 'w-14 h-14', text: 'text-xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Shield Emblem */}
      <div
        className={`${currentSize.img} rounded-xl overflow-hidden shadow-md shadow-blue-900/30 border border-blue-400/40 bg-slate-900 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
      >
        <img
          src={logoImg}
          alt="JM Sistemas - Soluções Tecnológicas"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${currentSize.text} ${
                variant === 'light' ? 'text-slate-900' : 'text-white'
              }`}
            >
              JM Sistemas
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`font-bold tracking-wider uppercase ${currentSize.sub} ${
                variant === 'light' ? 'text-blue-700' : 'text-blue-400'
              }`}
            >
              Soluções Tecnológicas
            </span>
          )}
        </div>
      )}
    </div>
  );
};
