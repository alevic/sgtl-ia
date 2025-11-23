// PRD v2.1 Schema Reflection
// Using Enums and Interfaces to strictly type the application

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
  CAMA_MASTER = 'CAMA_MASTER'
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
}

export interface IVeiculo {
  id: string;
  placa: string;
  modelo: string;
  tipo: 'ONIBUS' | 'CAMINHAO';
  status: VeiculoStatus;
  proxima_revisao_km: number;
  is_double_deck?: boolean; // só para ônibus
  capacidade_passageiros?: number; // só para ônibus
  capacidade_carga?: number; // só para caminhão (toneladas)
  mapa_assentos?: IAssento[]; // só para ônibus
  mapa_configurado?: boolean; // indica se o mapa foi configurado
}

export interface IMotorista {
  id: string;
  nome: string;
  cnh: string;
  categoria_cnh: string;
  validade_cnh: string; // ISO Date
  passaporte?: string;
  validade_passaporte?: string; // ISO Date
  status: 'DISPONIVEL' | 'EM_VIAGEM' | 'FERIAS' | 'AFASTADO';
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
  titulo: string;
  origem: string;
  destino: string;
  paradas: IParada[]; // Lista ordenada de paradas

  // Sistema de Rotas v2.0
  rota_ida_id?: string; // ID da rota template selecionada
  rota_volta_id?: string; // ID da rota template selecionada
  rota_ida?: IRota; // Dados completos da rota (populados)
  rota_volta?: IRota; // Dados completos da rota (populados)
  usa_sistema_rotas: boolean; // Flag para indicar se usa novo sistema

  data_partida: string; // ISO Date
  data_chegada_prevista: string; // ISO Date
  status: 'AGENDADA' | 'CONFIRMADA' | 'EM_CURSO' | 'FINALIZADA' | 'CANCELADA';
  veiculo_id?: string;

  // Motoristas - Suporte para múltiplos motoristas
  motorista_ids: string[]; // Array de IDs de motoristas
  motorista_id?: string; // DEPRECATED - mantido para retrocompatibilidade
  motorista_auxiliar_id?: string; // DEPRECATED - mantido para retrocompatibilidade

  ocupacao_percent: number;
  internacional: boolean;
  moeda_base: Moeda;
  tipo_viagem: 'IDA_E_VOLTA' | 'IDA' | 'VOLTA'; // Ordem: IDA_E_VOLTA primeiro
  precos_por_tipo: Record<string, number>;
  imagem_capa?: string;
  galeria?: string[];
}

export interface IAssento {
  numero: string;
  status: AssentoStatus;
  passageiro_nome?: string;
}

export interface IReserva {
  id: string;
  codigo: string;
  viagem_id: string;
  cliente_id: string;
  assento_numero: string;
  data_reserva: string; // ISO Date
  status: 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA' | 'UTILIZADA';
  valor_pago: number;
  moeda: Moeda;
  forma_pagamento?: 'DINHEIRO' | 'CARTAO' | 'PIX' | 'BOLETO';
  observacoes?: string;
}

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