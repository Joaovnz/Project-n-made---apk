import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  MapPin, 
  Cross, 
  Radio, 
  Wrench,
  Boxes
} from 'lucide-react';
import { ActiveTab, Language } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  lang
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: lang === 'pt' ? 'Início' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'ai' as ActiveTab,
      label: lang === 'pt' ? 'IA Tática' : 'Field AI',
      icon: Bot,
    },
    {
      id: 'maps' as ActiveTab,
      label: lang === 'pt' ? 'Mapas' : 'Maps',
      icon: MapPin,
    },
    {
      id: 'medical' as ActiveTab,
      label: lang === 'pt' ? 'Saúde' : 'Medical',
      icon: Cross,
    },
    {
      id: 'mesh' as ActiveTab,
      label: lang === 'pt' ? 'Rádio' : 'Comms',
      icon: Radio,
    },
    {
      id: 'tools' as ActiveTab,
      label: lang === 'pt' ? 'Úteis' : 'Tools',
      icon: Wrench,
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      aria-label="Navegação principal"
    >
      <div className="max-w-md mx-auto grid grid-cols-6 gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all relative ${
                isActive 
                  ? 'text-amber-400 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1 rounded-md transition-colors ${isActive ? 'bg-amber-500/15 text-amber-400' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight font-sans mt-0.5 truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-5 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
