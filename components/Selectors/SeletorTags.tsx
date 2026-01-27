import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Check, Tag as TagIcon, ChevronDown, Loader } from 'lucide-react';
import { ITag } from '../../types';
import { tripsService } from '../../services/tripsService';

interface SeletorTagsProps {
    selectedTags: string[];
    onChange: (tags: string[]) => void;
}

export const SeletorTags: React.FC<SeletorTagsProps> = ({ selectedTags, onChange }) => {
    const [availableTags, setAvailableTags] = useState<ITag[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadTags();
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadTags = async () => {
        try {
            setLoading(true);
            const data = await tripsService.getTags();
            setAvailableTags(data);
        } catch (error) {
            console.error('Error loading tags:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (tagName: string) => {
        if (selectedTags.includes(tagName)) {
            onChange(selectedTags.filter(t => t !== tagName));
        } else {
            onChange([...selectedTags, tagName]);
        }
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const newTagName = inputValue.trim();

            // Check if already selected
            if (selectedTags.includes(newTagName)) {
                setInputValue('');
                return;
            }

            // Check if exists in available but not selected
            const existing = availableTags.find(t => t.nome.toLowerCase() === newTagName.toLowerCase());
            if (existing) {
                toggleTag(existing.nome);
            } else {
                // Create new tag on-the-fly
                try {
                    const newTag = await tripsService.createTag({ nome: newTagName });
                    setAvailableTags(prev => [...prev, newTag]);
                    toggleTag(newTag.nome);
                } catch (error) {
                    console.error('Error creating tag:', error);
                    // Fallback: just add to selected if creation fails (maybe UI only)
                    toggleTag(newTagName);
                }
            }
            setInputValue('');
        }
    };

    const removeTag = (tagName: string) => {
        onChange(selectedTags.filter(t => t !== tagName));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="min-h-[42px] p-1.5 flex flex-wrap gap-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-sm cursor-text focus-within:ring-2 focus-within:ring-blue-500 transition-all"
                onClick={() => setIsOpen(true)}
            >
                {selectedTags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-md animate-in zoom-in-95"
                    >
                        {tag}
                        <button
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                            className="hover:text-blue-900 dark:hover:text-blue-100 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    placeholder={selectedTags.length === 0 ? "Adicionar tags..." : ""}
                    className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px] dark:text-white"
                />
                <div className="flex items-center pr-1 text-slate-400">
                    {loading ? <Loader size={16} className="animate-spin" /> : <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 space-y-1">
                        {loading && availableTags.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">Carregando tags...</div>
                        ) : (
                            <>
                                {availableTags
                                    .filter(t => t.nome.toLowerCase().includes(inputValue.toLowerCase()))
                                    .map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleTag(tag.nome)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${selectedTags.includes(tag.nome)
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <TagIcon size={14} className={selectedTags.includes(tag.nome) ? 'text-blue-500' : 'text-slate-400'} />
                                                {tag.nome}
                                            </div>
                                            {selectedTags.includes(tag.nome) && <Check size={14} />}
                                        </button>
                                    ))
                                }
                                {inputValue && !availableTags.find(t => t.nome.toLowerCase() === inputValue.toLowerCase()) && (
                                    <button
                                        onClick={() => handleKeyDown({ key: 'Enter', preventDefault: () => { }, target: { value: inputValue } } as any)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-md transition-colors font-medium border-t border-slate-100 dark:border-slate-700 mt-1 pt-2"
                                    >
                                        <Plus size={14} />
                                        Criar tag "{inputValue}"
                                    </button>
                                )}
                            </>
                        )}
                        {!loading && availableTags.length === 0 && !inputValue && (
                            <div className="p-4 text-center text-sm text-slate-500">Nenhuma tag cadastrada. Digite para criar.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
