import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseOFX } from '../../utils/ofxParser';
import { IExtratoBancario } from '../../types';

interface ImportadorExtratoProps {
    onImport: (extrato: IExtratoBancario) => void;
}

export const ImportadorExtrato: React.FC<ImportadorExtratoProps> = ({ onImport }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await processFile(files[0]);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFile(e.target.files[0]);
        }
    };

    const processFile = async (file: File) => {
        setError(null);
        setIsProcessing(true);

        try {
            if (file.name.toLowerCase().endsWith('.ofx')) {
                const extrato = await parseOFX(file);
                onImport(extrato);
            } else if (file.name.toLowerCase().endsWith('.csv')) {
                // TODO: Implementar parser CSV
                setError('Importação de CSV ainda não implementada. Por favor use OFX.');
            } else {
                setError('Formato de arquivo não suportado. Use .ofx ou .csv');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao processar arquivo. Verifique se é um OFX válido.');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="w-full">
            <div
                className={`border-2 border-dashed rounded-sm p-8 text-center transition-colors cursor-pointer
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".ofx,.csv"
                    onChange={handleFileSelect}
                />

                <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <Upload size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Importar Extrato Bancário
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Arraste seu arquivo OFX ou CSV aqui, ou clique para selecionar
                        </p>
                    </div>
                </div>
            </div>

            {isProcessing && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-sm flex items-center gap-3 animate-pulse">
                    <FileText size={20} />
                    <span>Processando arquivo...</span>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-sm flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 dark:hover:bg-red-800/30 p-1 rounded">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
