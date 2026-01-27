import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { EmpresaContexto } from '@/types';

// NOTE: In a real app, this key comes from process.env
// The system prompt forbids creating UI for API key entry, assuming env var.
// For the purpose of this demo component to be valid TypeScript:
const API_KEY = process.env.API_KEY || 'mock_key_for_build'; 

interface GeminiInsightsProps {
  context: EmpresaContexto;
  dataSummary: string;
}

export const GeminiInsights: React.FC<GeminiInsightsProps> = ({ context, dataSummary }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = async () => {
    if (!process.env.API_KEY) {
        setInsight("Nota: Para ver insights reais, configure a API_KEY do Gemini. Simulação: A taxa de ocupação está acima da média histórica, sugerindo abertura de horários extras para o fim de semana.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Contextual Prompt based on Company
      const promptContext = context === EmpresaContexto.TURISMO 
        ? "Você é um especialista em gestão de transporte turístico. Analise os dados abaixo e sugira ações para aumentar receita e ocupação."
        : "Você é um especialista em logística de cargas expressas. Analise os dados e sugira otimizações de rota e frota.";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${promptContext}\n\nDados Atuais: ${dataSummary}`,
        config: {
            temperature: 0.7,
            maxOutputTokens: 200,
        }
      });

      setInsight(response.text || "Sem insights gerados.");
    } catch (err) {
      console.error(err);
      setError("Falha ao conectar com Gemini AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-6 rounded-sm border border-indigo-100 dark:border-indigo-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles size={100} className="text-indigo-900 dark:text-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <Sparkles className="text-indigo-500 dark:text-indigo-400" size={20} />
            IA Insights Operacionais
          </h3>
          <button 
            onClick={generateInsight}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-sm border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? 'Analisando...' : 'Gerar Análise'}
          </button>
        </div>

        <div className="bg-white/60 dark:bg-black/20   rounded-sm p-4 border border-white/50 dark:border-white/10 min-h-[100px]">
          {error ? (
            <div className="text-red-500 dark:text-red-400 flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          ) : insight ? (
            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed animate-in fade-in duration-500">
              {insight}
            </p>
          ) : (
            <p className="text-slate-400 dark:text-slate-400 text-sm italic text-center py-4">
              Clique em "Gerar Análise" para processar os KPIs atuais com Gemini 2.5 Flash.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};