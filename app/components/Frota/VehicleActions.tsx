import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { IVeiculo } from '../../types';
import { Eye, Edit, Trash2, MoreHorizontal, AlertTriangle, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

interface VehicleActionsProps {
    veiculo: any;
    onUpdate?: () => void;
}

export const VehicleActions: React.FC<VehicleActionsProps> = ({ veiculo, onUpdate }) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        // Using form submit via fetcher would be better, but keeping fetch for now to minimize changes if onUpdate is used
        try {
            const response = await fetch(`/admin/fleet?intent=delete&id=${veiculo.id}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to delete vehicle');
            }

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error("Erro ao excluir veículo:", error);
            alert('Erro ao excluir veículo. Por favor, tente novamente.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-5 w-5" strokeWidth={2.5} />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none bg-card/95 backdrop-blur-md">
                    <DropdownMenuLabel className="text-[12px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Operações</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => navigate(`/admin/fleet/${veiculo.id}`)}
                        className="rounded-xl px-3 py-2.5 font-bold focus:bg-primary focus:text-primary-foreground gap-3"
                    >
                        <Eye className="h-4 w-4" />
                        Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => navigate(`/admin/fleet/edit/${veiculo.id}`)}
                        className="rounded-xl px-3 py-2.5 font-bold focus:bg-primary focus:text-primary-foreground gap-3"
                    >
                        <Edit className="h-4 w-4" />
                        Editar Veículo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50 my-2" />
                    <DropdownMenuItem
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl px-3 py-2.5 font-bold text-destructive focus:bg-destructive focus:text-destructive-foreground gap-3"
                    >
                        <Trash2 className="h-4 w-4" />
                        Excluir Registro
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>


            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="rounded-[2rem] border-none shadow-2xl max-w-sm p-8 bg-card/95 backdrop-blur-md">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={2.5} />
                        </div>
                        <div className="space-y-2 text-center">
                            <DialogTitle className="text-2xl font-black tracking-tight">Confirmar Exclusão</DialogTitle>
                            <DialogDescription className="font-medium text-muted-foreground leading-relaxed">
                                Você tem certeza que deseja excluir o veículo <span className="text-foreground font-black tracking-tight">{veiculo.placa}</span>?
                                <br />
                                <span className="text-xs uppercase font-black tracking-widest opacity-50">Esta ação é irreversível</span>
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <DialogFooter className="mt-8 flex-col sm:flex-col gap-3">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full h-12 rounded-2xl font-black tracking-tighter text-base shadow-lg shadow-destructive/20 active:scale-95 transition-all"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    EXCLUINDO...
                                </>
                            ) : (
                                "EXCLUIR DEFINITIVAMENTE"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="w-full h-12 rounded-2xl font-black tracking-tighter text-muted-foreground hover:bg-muted/50 transition-all"
                        >
                            CANCELAR
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
