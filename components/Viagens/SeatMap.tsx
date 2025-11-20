import React from 'react';
import { AssentoStatus, IAssento } from '../../types';

interface SeatMapProps {
  assentos: IAssento[];
  onSelect: (numero: string) => void;
  selectedSeat: string | null;
}

export const SeatMap: React.FC<SeatMapProps> = ({ assentos, onSelect, selectedSeat }) => {
  // Simulating a 4-column bus layout (2 - aisle - 2)
  // This is a visual abstraction
  
  const getStatusClass = (status: AssentoStatus, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 dark:ring-blue-900';
    switch (status) {
      case AssentoStatus.LIVRE: return 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 cursor-pointer';
      case AssentoStatus.OCUPADO: return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-400 dark:text-red-400 cursor-not-allowed';
      case AssentoStatus.PENDENTE: return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-500 cursor-not-allowed';
      case AssentoStatus.BLOQUEADO: return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed';
      default: return 'bg-slate-200 dark:bg-slate-700';
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 max-w-sm mx-auto">
      <div className="text-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-16 h-8 bg-slate-300 dark:bg-slate-600 rounded-lg mx-auto mb-2 opacity-50"></div>
        <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Frente do Ônibus</span>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-8">
        {/* Column headers */}
        <div className="col-span-2 text-center text-xs text-slate-400">Janela</div>
        <div className="col-span-1"></div>
        <div className="col-span-2 text-center text-xs text-slate-400">Janela</div>

        {/* Seats Generation */}
        {assentos.map((seat, idx) => {
          // Add an aisle every 2 seats
          const isAisle = (idx % 4 === 2);
          
          return (
            <React.Fragment key={seat.numero}>
              {idx % 4 === 2 && <div className="col-span-1 flex justify-center items-center text-xs text-slate-300 dark:text-slate-600 font-mono">{Math.floor(idx/4) + 1}</div>}
              
              <button
                disabled={seat.status !== AssentoStatus.LIVRE}
                onClick={() => onSelect(seat.numero)}
                className={`
                  h-10 w-full rounded-t-lg rounded-b-md border-2 flex items-center justify-center text-sm font-bold transition-all
                  ${getStatusClass(seat.status, selectedSeat === seat.numero)}
                `}
              >
                {seat.numero}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex justify-between px-2 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></div> Livre</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600"></div> Selecionado</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"></div> Ocupado</div>
      </div>
    </div>
  );
};