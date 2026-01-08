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
  ATIVO = 'ATIVO',
  MANUTENCAO = 'MANUTENCAO',
  EM_VIAGEM = 'EM_VIAGEM'
}

export enum AssentoStatus {
  LIVRE = 'LIVRE',
  OCUPADO = 'OCUPADO',
  PENDENTE = 'PENDENTE',
  BLOQUEADO = 'BLOQUEADO'
}

export enum TipoDocumento {
  RG = 'RG',
  CPF = 'CPF',
  PASSAPORTE = 'PASSAPORTE',
  CNH = 'CNH',
  RNE = 'RNE',
  OUTRO = 'OUTRO'
}

export enum Moeda {
  BRL = 'BRL',
  USD = 'USD',
  EUR = 'EUR',
  PYG = 'PYG', // Guarani
  ARS = 'ARS'  // Peso Argentino
}

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
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
  TRANSFERENCIA = 'TRANSFERENCIA'
}

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

export enum StatusTransacao {
  PENDENTE = 'PENDENTE',
  PAGA = 'PAGA',
  VENCIDA = 'VENCIDA',
  CANCELADA = 'CANCELADA',
  PARCIALMENTE_PAGA = 'PARCIALMENTE_PAGA'
}

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  CHEQUE = 'CHEQUE'
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

export interface IMotorista {
  id: string;
  nome: string;

  // Documentação
  cnh: string;
  categoria_cnh: string;
  validade_cnh: string; // ISO Date
  passaporte?: string;
  validade_passaporte?: string; // ISO Date

  // Contatos
  telefone?: string;
  email?: string;

  // Endereço
  endereco?: string;
  cidade?: string;
  estado?: string;
  pais?: string;

  // Status e disponibilidade
  status: 'DISPONIVEL' | 'EM_VIAGEM' | 'FOLGA' | 'AFASTADO';
  data_contratacao: string; // ISO Date
  salario?: number;

  // Experiência
  anos_experiencia?: number;
  viagens_internacionais?: number;
  disponivel_internacional?: boolean;

  // Observações
  observacoes?: string;
}

export interface ICliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  saldo_creditos: number;
  historico_viagens: number;
  documento_tipo: TipoDocumento;
  documento_numero: string;
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
}

export interface IInteracao {
  id: string;
  cliente_id: string;
  tipo: 'EMAIL' | 'TELEFONE' | 'WHATSAPP' | 'PRESENCIAL' | 'SISTEMA';
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
  nome: string; // Nome da cidade ou ponto
  horario_chegada: string; // ISO Date
  horario_partida: string; // ISO Date
  tipo: 'EMBARQUE' | 'DESEMBARQUE' | 'PARADA_TECNICA';
}

// Sistema de Rotas v2.0
export interface IPontoRota {
  id: string;
  nome: string; // Nome da cidade ou local
  ordem: number; // Ordem na sequência da rota (0 = origem, last = destino)
  horario_chegada?: string; // ISO Date - opcional para origem
  horario_partida?: string; // ISO Date - opcional para destino
  tipo: 'ORIGEM' | 'PARADA_INTERMEDIARIA' | 'DESTINO';
  permite_embarque: boolean;
  permite_desembarque: boolean;
  observacoes?: string;
  // Location IDs for editing
  state_id?: number;
  city_id?: number;
  neighborhood_id?: number;

  // Novos campos para V2 (Duração Relativa)
  distancia_do_anterior_km?: number;
  duracao_deslocamento_minutos?: number; // Tempo para chegar do anterior até este
  duracao_parada_minutos?: number; // Tempo que fica parado neste ponto
  tempo_acumulado_minutos?: number; // Calculado: tempo total do início até a saída deste ponto
}

export interface IRota {
  id: string;
  nome?: string; // Nome descritivo da rota (ex: "São Paulo → Rio via Curitiba")
  tipo_rota: 'IDA' | 'VOLTA';
  pontos: IPontoRota[]; // Lista ordenada de pontos (origem, paradas, destino)
  distancia_total_km?: number;
  duracao_estimada_minutos?: number;
  ativa: boolean; // Indica se a rota está ativa para uso
}

export interface IViagem {
  id: string;
  organization_id?: string;

  // Backend Fields
  route_id: string;
  return_route_id?: string;
  vehicle_id?: string;
  driver_id?: string;

  departure_date: string; // YYYY-MM-DD
  departure_time: string; // HH:MM:SS
  arrival_date?: string; // YYYY-MM-DD
  arrival_time?: string; // HH:MM:SS

  status: 'SCHEDULED' | 'BOARDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED' | 'DELAYED' | 'AGENDADA' | 'CONFIRMADA' | 'EM_CURSO' | 'FINALIZADA' | 'CONFIRMED'; // Mixed for compatibility

  price_conventional?: number;
  price_executive?: number;
  price_semi_sleeper?: number;
  price_sleeper?: number;
  price_bed?: number;
  price_master_bed?: number;
  seats_available?: number;
  notes?: string;

  // New Fields
  title?: string;
  tags?: string[]; // Replacing trip_type
  cover_image?: string;
  gallery?: string[]; // JSONB in DB
  baggage_limit?: string;
  alerts?: string;

  // Joined Fields (Backend)
  route_name?: string;
  origin_city?: string;
  destination_city?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  driver_name?: string;
  route_stops?: any[]; // JSON from DB
  return_route_name?: string;
  return_route_stops?: any[];
  active?: boolean;

  // Frontend Legacy / Derived Fields (Deprecated or Mapped)
  titulo?: string; // Kept for compatibility if used elsewhere, but now maps to backend 'title'
  origem?: string; // Mapped from origin_city
  destino?: string; // Mapped from destination_city
  paradas?: IParada[];
  data_partida?: string; // ISO Date
  data_chegada_prevista?: string; // ISO Date

  // Sistema de Rotas v2.0 Legacy
  rota_ida_id?: string;
  rota_volta_id?: string;
  rota_ida?: IRota;
  rota_volta?: IRota;
  usa_sistema_rotas?: boolean;

  motorista_ids?: string[];
  ocupacao_percent?: number;
  internacional?: boolean;
  moeda_base?: Moeda;
  tipo_viagem?: 'IDA_E_VOLTA' | 'IDA' | 'VOLTA'; // This is for route configuration, distinct from 'trip_type'
  precos_por_tipo?: Record<string, number>;
  imagem_capa?: string; // Legacy, map to cover_image
  galeria?: string[]; // Legacy, map to gallery
}

// Passageiro individual em uma reserva
export interface IPassageiroReserva {
  id: string;
  cliente_id: string; // Referência ao cliente
  assento_numero: string;
  tipo_assento: TipoAssento;
  valor: number;
}

export interface IReserva {
  id: string;
  codigo: string;
  viagem_id: string;
  responsavel_id: string; // Quem fez a compra/reserva
  passageiros: IPassageiroReserva[]; // Lista de passageiros
  data_reserva: string; // ISO Date
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'USED' | 'CHECKED_IN' | 'NO_SHOW' | 'COMPLETED';
  valor_total: number; // Soma dos valores dos passageiros
  moeda: Moeda;
  forma_pagamento?: 'DINHEIRO' | 'CARTAO' | 'PIX' | 'BOLETO';
  observacoes?: string;

  // @deprecated - Campos mantidos para compatibilidade
  cliente_id?: string;
  assento_numero?: string;
  valor_pago?: number;
  // Backend Mapped Fields
  price?: number; // Backend column name
  amount_paid?: number;
  payment_method?: string;
  boarding_point?: string;
  dropoff_point?: string;
}

export const StatusReservaLabel: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  USED: 'Utilizada',
  CHECKED_IN: 'Embarcado',
  NO_SHOW: 'Não Compareceu',
  COMPLETED: 'Concluída'
};

export enum TipoEncomenda {
  CARGA_ONIBUS = 'CARGA_ONIBUS',
  FRETE_CAMINHAO = 'FRETE_CAMINHAO'
}

export interface IEventoRastreamento {
  id: string;
  data_hora: string; // ISO Date
  local: string;
  descricao: string;
  tipo: 'RECEBIDO' | 'EM_TRANSITO' | 'CHEGOU' | 'SAIU_ENTREGA' | 'ENTREGUE';
}

export interface IEncomenda {
  id: string;
  codigo: string;
  tipo: TipoEncomenda;
  status: 'AGUARDANDO' | 'EM_TRANSITO' | 'ENTREGUE' | 'DEVOLVIDA';
  origem: string;
  destino: string;
  remetente_nome: string;
  destinatario_nome: string;
  destinatario_telefone: string;
  peso_kg: number;
  volume_m3: number;
  valor_declarado: number;
  moeda: Moeda;
  previsao_entrega: string; // ISO Date
  viagem_id?: string; // Se for em ônibus
  caminhao_id?: string; // Se for em caminhão
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
  dia_vencimento_fatura: number; // 1-31
}

export interface IFretamento {
  id: string;
  cliente_corporativo_id: string;
  veiculo_id?: string;
  motorista_id?: string;
  origem: string;
  destino: string;
  data_inicio: string; // ISO Date
  data_fim: string; // ISO Date
  tipo: 'PONTUAL' | 'RECORRENTE';
  rota_ida_id?: string;
  rota_volta_id?: string;
  status: 'SOLICITACAO' | 'ORCAMENTO_ENVIADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  valor_total: number;
  moeda: Moeda;
  observacoes?: string;
}

export enum TipoManutencao {
  PREVENTIVA = 'PREVENTIVA',
  CORRETIVA = 'CORRETIVA',
  PREDITIVA = 'PREDITIVA',
  INSPECAO = 'INSPECAO'
}

export enum StatusManutencao {
  AGENDADA = 'AGENDADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA'
}

export interface IManutencao {
  id: string;
  veiculo_id: string;
  tipo: TipoManutencao;
  status: StatusManutencao;
  data_agendada: string; // ISO Date
  data_inicio?: string; // ISO Date
  data_conclusao?: string; // ISO Date
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

// ===== FINANCIAL INTERFACES =====

export interface ITransacao {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  moeda: Moeda;
  data_emissao: string; // ISO Date
  data_vencimento: string; // ISO Date
  data_pagamento?: string; // ISO Date
  status: StatusTransacao;
  forma_pagamento?: FormaPagamento;

  // Categorização
  categoria_receita?: CategoriaReceita;
  categoria_despesa?: CategoriaDespesa;

  // Referências
  cliente_id?: string;
  fornecedor_id?: string;
  viagem_id?: string;
  reserva_id?: string;
  manutencao_id?: string;
  fretamento_id?: string;

  // Dados adicionais
  numero_documento?: string;
  observacoes?: string;
  anexos?: string[];

  // Centros de Custo
  centro_custo?: CentroCusto;
  classificacao_contabil?: ClassificacaoContabil;

  // Parcelas (se aplicável)
  parcela_atual?: number;
  total_parcelas?: number;

  // Auditoria
  criado_por: string;
  criado_em: string; // ISO Date
  atualizado_em?: string; // ISO Date
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
  centro_custo?: CentroCusto; // Sempre VENDAS para receitas
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
  referencia_id?: string; // ID da reserva, fretamento, etc.
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

// ===== BANK RECONCILIATION =====

export interface ITransacaoBancaria {
  id: string; // ID único do OFX ou gerado hash para CSV
  data: string; // ISO Date
  descricao: string;
  valor: number;
  tipo: 'CREDITO' | 'DEBITO';
  id_transacao_sistema?: string; // Link com a transação do sistema se conciliado
  status: 'PENDENTE' | 'CONCILIADO' | 'IGNORADO';
}

export interface IExtratoBancario {
  banco: string;
  agencia: string;
  conta: string;
  saldo_inicial: number;
  saldo_final: number;
  transacoes: ITransacaoBancaria[];
}

// ===== AUXILIARY REGISTRATIONS =====

export interface IPais {
  id: string;
  nome: string;
  sigla: string; // ISO 3166-1 alpha-2 (BR, US, etc.)
  ddi: string; // +55, +1, etc.
}

export interface IEstado {
  id: string;
  nome: string;
  uf: string; // Sigla do estado
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