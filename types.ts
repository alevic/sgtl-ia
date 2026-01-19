// PRD v2.1 Schema Reflection
// Using Enums and Interfaces to strictly type the application

export enum UserRole {
  ADMIN = 'admin',
  FINANCEIRO = 'financeiro',
  OPERACIONAL = 'operacional',
  USER = 'user'
}

export enum EmpresaContexto {
  TURISMO = 'TURISMO',
  EXPRESS = 'EXPRESS'
}

export enum VeiculoStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  IN_TRANSIT = 'IN_TRANSIT'
}

export const VeiculoStatusLabel: Record<VeiculoStatus, string> = {
  [VeiculoStatus.ACTIVE]: 'Ativo',
  [VeiculoStatus.MAINTENANCE]: 'Em Manutenção',
  [VeiculoStatus.IN_TRANSIT]: 'Em Viagem'
};

export enum AssentoStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED'
}

export const AssentoStatusLabel: Record<AssentoStatus, string> = {
  [AssentoStatus.AVAILABLE]: 'Livre',
  [AssentoStatus.OCCUPIED]: 'Ocupado',
  [AssentoStatus.PENDING]: 'Pendente',
  [AssentoStatus.BLOCKED]: 'Bloqueado'
};

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  BOARDING = 'BOARDING',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED'
}

export const TripStatusLabel: Record<TripStatus, string> = {
  [TripStatus.SCHEDULED]: 'Agendada',
  [TripStatus.BOARDING]: 'Embarque',
  [TripStatus.IN_TRANSIT]: 'Em Curso',
  [TripStatus.COMPLETED]: 'Finalizada',
  [TripStatus.CANCELLED]: 'Cancelada',
  [TripStatus.DELAYED]: 'Atrasada'
};

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  USED = 'USED',
  CHECKED_IN = 'CHECKED_IN',
  NO_SHOW = 'NO_SHOW',
  COMPLETED = 'COMPLETED'
}

export const ReservationStatusLabel: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: 'Pendente',
  [ReservationStatus.CONFIRMED]: 'Confirmada',
  [ReservationStatus.CANCELLED]: 'Cancelada',
  [ReservationStatus.USED]: 'Utilizada',
  [ReservationStatus.CHECKED_IN]: 'Embarcado',
  [ReservationStatus.NO_SHOW]: 'Não Compareceu',
  [ReservationStatus.COMPLETED]: 'Concluída'
};

export enum EncomendaStatus {
  AWAITING = 'AWAITING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED'
}

export const EncomendaStatusLabel: Record<EncomendaStatus, string> = {
  [EncomendaStatus.AWAITING]: 'Aguardando',
  [EncomendaStatus.IN_TRANSIT]: 'Em Trânsito',
  [EncomendaStatus.DELIVERED]: 'Entregue',
  [EncomendaStatus.RETURNED]: 'Devolvida'
};

export enum FretamentoStatus {
  REQUEST = 'REQUEST',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export const FretamentoStatusLabel: Record<FretamentoStatus, string> = {
  [FretamentoStatus.REQUEST]: 'Solicitação',
  [FretamentoStatus.QUOTED]: 'Orçamento Enviado',
  [FretamentoStatus.CONFIRMED]: 'Confirmado',
  [FretamentoStatus.IN_PROGRESS]: 'Em Andamento',
  [FretamentoStatus.COMPLETED]: 'Concluído',
  [FretamentoStatus.CANCELLED]: 'Cancelado'
};

export enum TipoEncomenda {
  BUS_CARGO = 'BUS_CARGO',
  TRUCK_FREIGHT = 'TRUCK_FREIGHT'
}

export const TipoEncomendaLabel: Record<TipoEncomenda, string> = {
  [TipoEncomenda.BUS_CARGO]: 'Carga Ônibus',
  [TipoEncomenda.TRUCK_FREIGHT]: 'Frete Caminhão'
};

export enum StatusManutencao {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export const StatusManutencaoLabel: Record<StatusManutencao, string> = {
  [StatusManutencao.SCHEDULED]: 'Agendada',
  [StatusManutencao.IN_PROGRESS]: 'Em Andamento',
  [StatusManutencao.COMPLETED]: 'Concluída',
  [StatusManutencao.CANCELLED]: 'Cancelada'
};

export enum TipoDocumento {
  CPF = 'CPF',
  RG = 'RG',
  CNH = 'CNH',
  PASSAPORTE = 'PASSAPORTE',
  RNE = 'RNE',
  CNPJ = 'CNPJ',
  OUTRO = 'OUTRO'
}

export enum TipoCliente {
  PESSOA_FISICA = 'PESSOA_FISICA',
  PESSOA_JURIDICA = 'PESSOA_JURIDICA'
}

export enum Moeda {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
  PYG = 'PYG', // Guarani
  ARS = 'ARS'  // Peso Argentino
}

export enum TipoManutencao {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  PREDICTIVE = 'PREDICTIVE',
  INSPECTION = 'INSPECTION'
}

export const TipoManutencaoLabel: Record<TipoManutencao, string> = {
  [TipoManutencao.PREVENTIVE]: 'Preventiva',
  [TipoManutencao.CORRECTIVE]: 'Corretiva',
  [TipoManutencao.PREDICTIVE]: 'Preditiva',
  [TipoManutencao.INSPECTION]: 'Inspeção'
};

export enum TipoParada {
  EMBARQUE = 'EMBARQUE',
  DESEMBARQUE = 'DESEMBARQUE',
  PARADA_TECNICA = 'PARADA_TECNICA'
}

export enum TipoAssento {
  CONVENCIONAL = 'CONVENCIONAL',
  EXECUTIVO = 'EXECUTIVO',
  SEMI_LEITO = 'SEMI_LEITO',
  LEITO = 'LEITO',
  CAMA = 'CAMA',
  CAMA_MASTER = 'CAMA_MASTER',
  BLOQUEADO = 'BLOQUEADO'
}

// ===== FINANCIAL ENUMS =====
export enum TipoTransacao {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

export const TipoTransacaoLabel: Record<TipoTransacao, string> = {
  [TipoTransacao.INCOME]: 'Receita',
  [TipoTransacao.EXPENSE]: 'Despesa',
  [TipoTransacao.TRANSFER]: 'Transferência'
};

export enum StatusTransacao {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PARTIALLY_PAID = 'PARTIALLY_PAID'
}

export const StatusTransacaoLabel: Record<StatusTransacao, string> = {
  [StatusTransacao.PENDING]: 'Pendente',
  [StatusTransacao.PAID]: 'Pago',
  [StatusTransacao.OVERDUE]: 'Vencido',
  [StatusTransacao.CANCELLED]: 'Cancelado',
  [StatusTransacao.PARTIALLY_PAID]: 'Parcialmente Pago'
};

export enum FormaPagamento {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  DIGITAL = 'DIGITAL' // For ASAAS/Online
}

export const FormaPagamentoLabel: Record<FormaPagamento, string> = {
  [FormaPagamento.CASH]: 'Dinheiro',
  [FormaPagamento.CREDIT_CARD]: 'Cartão de Crédito',
  [FormaPagamento.DEBIT_CARD]: 'Cartão de Débito',
  [FormaPagamento.PIX]: 'PIX',
  [FormaPagamento.BOLETO]: 'Boleto',
  [FormaPagamento.BANK_TRANSFER]: 'Transferência',
  [FormaPagamento.CHECK]: 'Cheque',
  [FormaPagamento.DIGITAL]: 'Digital (Online)'
};

export enum CategoriaReceita {
  VENDA_PASSAGEM = 'VENDA_PASSAGEM',
  FRETAMENTO = 'FRETAMENTO',
  ENCOMENDA = 'ENCOMENDA',
  OUTROS = 'OUTROS'
}

export enum CategoriaDespesa {
  COMBUSTIVEL = 'COMBUSTIVEL',
  MANUTENCAO = 'MANUTENCAO',
  PECAS = 'PECAS',
  SALARIOS = 'SALARIOS',
  FOLHA_PAGAMENTO = 'FOLHA_PAGAMENTO',
  IMPOSTOS = 'IMPOSTOS',
  PEDAGIO = 'PEDAGIO',
  SEGURO = 'SEGURO',
  ALUGUEL = 'ALUGUEL',
  OUTROS = 'OUTROS'
}

// Centros de Custo
export enum CentroCusto {
  ESTOQUE = 'ESTOQUE',           // Equipamentos e produtos
  VENDAS = 'VENDAS',             // Serviços prestados (receitas + custos)
  ADMINISTRATIVO = 'ADMINISTRATIVO' // RH, Financeiro, Marketing, etc.
}

// Classificação Contábil
export enum ClassificacaoContabil {
  CUSTO_FIXO = 'CUSTO_FIXO',           // Ex: Depreciação de veículos, Seguro
  CUSTO_VARIAVEL = 'CUSTO_VARIAVEL',   // Ex: Combustível, peças, manutenção
  DESPESA_FIXA = 'DESPESA_FIXA',       // Ex: Salários, aluguel
  DESPESA_VARIAVEL = 'DESPESA_VARIAVEL' // Ex: Comissões, marketing variável
}

// INTERFACES
export interface IEmpresa {
  id: string;
  nome_fantasia: string;
  tipo: EmpresaContexto;
  cor_primaria: string;
  logo_url?: string;
}

export interface IAssento {
  id: string;
  numero: string;
  andar: 1 | 2; // 1 = térreo, 2 = superior (double deck)
  posicao_x: number; // coluna (0-4, geralmente)
  posicao_y: number; // linha/fileira
  tipo: TipoAssento;
  status: AssentoStatus;
  disabled?: boolean; // Assento desabilitado (escada, frigobar, manutenção, etc)
  passageiro_nome?: string;
}

export interface IVeiculoFeature {
  id?: string;
  category?: string;
  label: string;
  value: string;
}

export interface IVeiculo {
  id: string;
  placa: string;
  modelo: string;
  tipo: 'ONIBUS' | 'CAMINHAO';
  status: VeiculoStatus;
  km_atual: number;
  proxima_revisao_km: number;
  ultima_revisao?: string; // ISO Date
  is_double_deck?: boolean; // só para ônibus
  capacidade_passageiros?: number; // só para ônibus
  capacidade_carga?: number; // só para caminhão (toneladas)
  mapa_assentos?: IAssento[]; // só para ônibus
  mapa_configurado?: boolean; // indica se o mapa foi configurado
  precos_assentos?: Record<TipoAssento, number>; // preço por tipo de assento
  features?: IVeiculoFeature[];
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  IN_TRANSIT = 'IN_TRANSIT',
  ON_LEAVE = 'ON_LEAVE',
  AWAY = 'AWAY'
}

export const DriverStatusLabel: Record<DriverStatus, string> = {
  [DriverStatus.AVAILABLE]: 'Disponível',
  [DriverStatus.IN_TRANSIT]: 'Em Viagem',
  [DriverStatus.ON_LEAVE]: 'Folga',
  [DriverStatus.AWAY]: 'Afastado'
};

export interface IMotorista {
  id: string;
  nome: string;
  cnh: string;
  categoria_cnh: string;
  validade_cnh: string; // ISO Date
  passaporte?: string;
  validade_passaporte?: string; // ISO Date
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  status: DriverStatus;
  data_contratacao: string; // ISO Date
  salario?: number;
  anos_experiencia?: number;
  viagens_internacionais?: number;
  disponivel_internacional?: boolean;
  observacoes?: string;
}

export interface ICliente {
  id: string;
  tipo_cliente: TipoCliente; // PESSOA_FISICA or PESSOA_JURIDICA

  // Fields that change meaning based on tipo_cliente
  nome: string; // PF: client name | PJ: representative name
  email: string;
  telefone?: string;

  // Document (representative for PF, or representative for PJ)
  documento_tipo: TipoDocumento;
  documento: string; // Renamed from documento_numero

  // Corporate fields (null if PF)
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;

  // Common fields
  saldo_creditos: number;
  historico_viagens: number;
  nacionalidade: string;
  data_cadastro: string; // ISO Date
  data_nascimento?: string; // ISO Date
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais: string;
  segmento: 'VIP' | 'REGULAR' | 'NOVO' | 'INATIVO';
  tags: string[];
  ultima_viagem?: string; // ISO Date
  valor_total_gasto: number;
  observacoes?: string;
  user_id?: string;
  organization_id?: string;
}

export enum TipoInteracao {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
  IN_PERSON = 'IN_PERSON',
  SYSTEM = 'SYSTEM'
}

export const TipoInteracaoLabel: Record<TipoInteracao, string> = {
  [TipoInteracao.EMAIL]: 'E-mail',
  [TipoInteracao.PHONE]: 'Telefone',
  [TipoInteracao.WHATSAPP]: 'WhatsApp',
  [TipoInteracao.IN_PERSON]: 'Presencial',
  [TipoInteracao.SYSTEM]: 'Sistema'
};

export interface IInteracao {
  id: string;
  cliente_id: string;
  tipo: TipoInteracao;
  descricao: string;
  data_hora: string; // ISO Date
  usuario_responsavel?: string;
}

export interface INota {
  id: string;
  cliente_id: string;
  titulo: string;
  conteudo: string;
  data_criacao: string; // ISO Date
  criado_por: string;
  importante: boolean;
}

export interface IParada {
  id: string;
  nome: string;
  horario_chegada: string; // ISO Date
  horario_partida: string; // ISO Date
  tipo: 'EMBARQUE' | 'DESEMBARQUE' | 'PARADA_TECNICA';
}

export interface IPontoRota {
  id: string;
  nome: string;
  ordem: number;
  horario_chegada?: string;
  horario_partida?: string;
  tipo: 'ORIGEM' | 'PARADA_INTERMEDIARIA' | 'DESTINO';
  permite_embarque: boolean;
  permite_desembarque: boolean;
  observacoes?: string;
  state_id?: number;
  city_id?: number;
  neighborhood_id?: number;
  distancia_do_anterior_km?: number;
  duracao_deslocamento_minutos?: number;
  duracao_parada_minutos?: number;
  tempo_acumulado_minutos?: number;
}

export enum RouteType {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND'
}

export const RouteTypeLabel: Record<RouteType, string> = {
  [RouteType.OUTBOUND]: 'Ida',
  [RouteType.INBOUND]: 'Volta'
};

export interface IRota {
  id: string;
  nome?: string;
  tipo_rota: RouteType;
  pontos: IPontoRota[];
  distancia_total_km?: number;
  duracao_estimada_minutos?: number;
  ativa: boolean;
}

export interface IViagem {
  id: string;
  organization_id?: string;
  route_id: string;
  return_route_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  departure_date: string;
  departure_time: string;
  arrival_date?: string;
  arrival_time?: string;
  status: TripStatus;
  price_conventional?: number;
  price_executive?: number;
  price_semi_sleeper?: number;
  price_sleeper?: number;
  price_bed?: number;
  price_master_bed?: number;
  seats_available?: number;
  notes?: string;
  title?: string;
  tags?: string[];
  cover_image?: string;
  gallery?: string[];
  baggage_limit?: string;
  alerts?: string;
  route_name?: string;
  origin_city?: string;
  destination_city?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  driver_name?: string;
  route_stops?: any[];
  return_route_name?: string;
  return_route_stops?: any[];
  active?: boolean;
  titulo?: string;
  origem?: string;
  destino?: string;
  paradas?: IParada[];
  data_partida?: string;
  data_chegada_prevista?: string;
  rota_ida_id?: string;
  rota_volta_id?: string;
  rota_ida?: IRota;
  rota_volta?: IRota;
  usa_sistema_rotas?: boolean;
  motorista_ids?: string[];
  ocupacao_percent?: number;
  internacional?: boolean;
  moeda_base?: Moeda;
  tipo_viagem?: 'IDA_E_VOLTA' | 'IDA' | 'VOLTA';
  precos_por_tipo?: Record<string, number>;
  imagem_capa?: string;
  galeria?: string[];
}

export interface IPassageiroReserva {
  id: string;
  cliente_id: string;
  assento_numero: string;
  tipo_assento: TipoAssento;
  valor: number;
}

export interface IReserva {
  id: string;
  codigo: string;
  viagem_id: string;
  responsavel_id: string;
  passageiros: IPassageiroReserva[];
  data_reserva: string;
  status: ReservationStatus;
  valor_total: number;
  moeda: Moeda;
  forma_pagamento?: 'DINHEIRO' | 'CARTAO' | 'PIX' | 'BOLETO';
  observacoes?: string;
  cliente_id?: string;
  assento_numero?: string;
  valor_pago?: number;
  price?: number;
  amount_paid?: number;
  payment_method?: string;
  boarding_point?: string;
  dropoff_point?: string;
}

export interface IEventoRastreamento {
  id: string;
  data_hora: string;
  local: string;
  descricao: string;
  tipo: 'RECEBIDO' | 'EM_TRANSITO' | 'CHEGOU' | 'SAIU_ENTREGA' | 'ENTREGUE';
}

export interface IEncomenda {
  id: string;
  codigo: string;
  tipo: TipoEncomenda;
  status: EncomendaStatus;
  origem: string;
  destino: string;
  remetente_nome: string;
  destinatario_nome: string;
  destinatario_telefone: string;
  peso_kg: number;
  volume_m3: number;
  valor_declarado: number;
  moeda: Moeda;
  previsao_entrega: string;
  viagem_id?: string;
  caminhao_id?: string;
  historico: IEventoRastreamento[];
}

export interface IClienteCorporativo {
  id: string;
  razao_social: string;
  cnpj: string;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  centro_custo?: string;
  credito_disponivel: number;
  dia_vencimento_fatura: number;
}

export interface IFretamento {
  id: string;
  cliente_corporativo_id: string;
  veiculo_id?: string;
  motorista_id?: string;
  origem: string;
  destino: string;
  data_inicio: string;
  data_fim: string;
  tipo: 'PONTUAL' | 'RECORRENTE';
  rota_ida_id?: string;
  rota_volta_id?: string;
  status: FretamentoStatus;
  valor_total: number;
  moeda: Moeda;
  observacoes?: string;
}

export interface IManutencao {
  id: string;
  veiculo_id: string;
  tipo: TipoManutencao;
  status: StatusManutencao;
  data_agendada: string;
  data_inicio?: string;
  data_conclusao?: string;
  km_veiculo: number;
  descricao: string;
  custo_pecas: number;
  custo_mao_de_obra: number;
  moeda: Moeda;
  oficina?: string;
  responsavel?: string;
  observacoes?: string;
  anexos?: string[];
}

export interface ITransacao {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  moeda: Moeda;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  status: StatusTransacao;
  forma_pagamento?: FormaPagamento;
  categoria_receita?: CategoriaReceita;
  categoria_despesa?: CategoriaDespesa;
  cliente_id?: string;
  fornecedor_id?: string;
  viagem_id?: string;
  reserva_id?: string;
  manutencao_id?: string;
  fretamento_id?: string;
  numero_documento?: string;
  observacoes?: string;
  anexos?: string[];
  centro_custo?: CentroCusto;
  classificacao_contabil?: ClassificacaoContabil;
  parcela_atual?: number;
  total_parcelas?: number;
  criado_por: string;
  criado_em: string;
  atualizado_em?: string;
}

export interface IContaPagar {
  id: string;
  fornecedor: string;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  moeda: Moeda;
  data_emissao: string;
  data_vencimento: string;
  status: StatusTransacao;
  categoria: CategoriaDespesa;
  numero_documento?: string;
  observacoes?: string;
  anexos?: string[];
  centro_custo?: CentroCusto;
  classificacao_contabil?: ClassificacaoContabil;
}

export interface IContaReceber {
  id: string;
  cliente_nome: string;
  cliente_id?: string;
  descricao: string;
  valor_total: number;
  valor_recebido: number;
  moeda: Moeda;
  data_emissao: string;
  data_vencimento: string;
  status: StatusTransacao;
  categoria: CategoriaReceita;
  numero_documento?: string;
  observacoes?: string;
  centro_custo?: CentroCusto;
}

export interface IFatura {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nome: string;
  data_emissao: string;
  data_vencimento: string;
  valor_total: number;
  valor_pago: number;
  moeda: Moeda;
  status: StatusTransacao;
  itens: IItemFatura[];
  observacoes?: string;
}

export interface IItemFatura {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  referencia_id?: string;
  referencia_tipo?: 'RESERVA' | 'FRETAMENTO' | 'ENCOMENDA';
}

export interface IRelatorioFinanceiro {
  periodo_inicio: string;
  periodo_fim: string;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  moeda: Moeda;
  receitas_por_categoria: Record<CategoriaReceita, number>;
  despesas_por_categoria: Record<CategoriaDespesa, number>;
}

export interface ITransacaoBancaria {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'CREDITO' | 'DEBITO';
  id_transacao_sistema?: string;
  status: 'PENDING' | 'RECONCILED' | 'IGNORED';
}

export interface IExtratoBancario {
  banco: string;
  agencia: string;
  conta: string;
  saldo_inicial: number;
  saldo_final: number;
  transacoes: ITransacaoBancaria[];
}

export interface IPais {
  id: string;
  nome: string;
  sigla: string;
  ddi: string;
}

export interface IEstado {
  id: string;
  nome: string;
  uf: string;
  pais_id: string;
}

export interface ICidade {
  id: string;
  nome: string;
  estado_id: string;
  ibge_code?: string;
}

export interface IBairro {
  id: string;
  nome: string;
  cidade_id: string;
}

export interface ITag {
  id: string;
  nome: string;
  cor?: string;
  organization_id?: string;
}