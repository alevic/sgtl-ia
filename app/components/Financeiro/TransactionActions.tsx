import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Edit, Trash2, CheckCircle, Clock, MoreHorizontal, AlertTriangle, Loader2, ArrowUpDown } from 'lucide-react';
import { ITransacao, StatusTransacao } from '../../types';
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

interface TransactionActionsProps {
    transacao: ITransacao;
    onUpdate: () => void;
}

export const TransactionActions: React.FC<TransactionActionsProps> = ({ transacao, onUpdate }) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions/${transacao.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Falha ao excluir');
            onUpdate();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir transação");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleStatusChange = async (newStatus: StatusTransacao) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions/${transacao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...transacao, status: newStatus }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Falha ao atualizar status');
            onUpdate();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status");
        }
    };

    const isPaid = transacao.status === StatusTransacao.PAID || (transacao.status as any) === 'PAGA';
    const isPending = transacao.status === StatusTransacao.PENDING || (transacao.status as any) === 'PENDENTE';

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
                        onClick={() => navigate('/admin/financeiro/transacoes/nova', { state: transacao })}
                        className="rounded-xl px-3 py-2.5 font-bold focus:bg-primary focus:text-primary-foreground gap-3"
                    >
                        <Edit className="h-4 w-4" />
                        Editar Registro
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-border/50 my-2" />
                    <DropdownMenuLabel className="text-[12px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Alterar Status</DropdownMenuLabel>

                    {!isPaid && (
                        <DropdownMenuItem
                            onClick={() => handleStatusChange(StatusTransacao.PAID)}
                            className="rounded-xl px-3 py-2.5 font-bold text-emerald-600 focus:bg-emerald-500 focus:text-white gap-3"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Marcar como Paga
                        </DropdownMenuItem>
                    )}

                    {!isPending && (
                        <DropdownMenuItem
                            onClick={() => handleStatusChange(StatusTransacao.PENDING)}
                            className="rounded-xl px-3 py-2.5 font-bold text-amber-600 focus:bg-amber-500 focus:text-white gap-3"
                        >
                            <Clock className="h-4 w-4" />
                            Marcar como Pendente
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-border/50 my-2" />
                    <DropdownMenuItem
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl px-3 py-2.5 font-bold text-destructive focus:bg-destructive focus:text-destructive-foreground gap-3"
                    >
                        <Trash2 className="h-4 w-4" />
                        Excluir Transação
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
                                Você tem certeza que deseja excluir esta transação de <strong className="text-foreground">R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>?
                                <br />
                                <span className="text-xs uppercase font-black tracking-widest opacity-50 text-destructive">Esta ação é irreversível</span>
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
