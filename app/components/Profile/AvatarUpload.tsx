import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
    currentAvatar?: string;
    userName: string;
    onUploadSuccess: (imageUrl: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatar, userName, onUploadSuccess }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas imagens');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!preview) return;

        setIsUploading(true);
        try {
            // Convert preview to blob
            const response = await fetch(preview);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append('avatar', blob, 'avatar.jpg');

            const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/avatar`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (uploadResponse.ok) {
                const data = await uploadResponse.json();
                onUploadSuccess(data.imageUrl);
                setPreview(null);
            } else {
                const error = await uploadResponse.json();
                alert(error.error || 'Erro ao fazer upload da imagem');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const avatarUrl = preview || currentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=400`;

    return (
        <div className="relative">
            <div className="relative group">
                <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-lg object-cover bg-white"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg group-hover:scale-110 transform"
                    title="Alterar foto"
                >
                    <Camera size={18} />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                />
            </div>

            {/* Upload Modal */}
            {preview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nova Foto de Perfil</h3>
                            <button
                                onClick={() => setPreview(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-64 object-cover rounded-xl"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setPreview(null)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Salvar Foto
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
