import { ArrowRight, BadgeCheck, BarChart3, CalendarRange, Hotel, Layers3, Receipt, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import Login from './Login';

const highlights = [
  {
    title: 'Reservas e disponibilidade',
    description: 'Organize acomodações, bloqueios, entradas, saídas e futuras hospedagens em um só fluxo.',
    icon: CalendarRange,
  },
  {
    title: 'Operação sem retrabalho',
    description: 'Recepção, governança e atendimento trabalham melhor quando o time consulta o mesmo painel.',
    icon: Layers3,
  },
  {
    title: 'Visão gerencial',
    description: 'Acompanhe ocupação, financeiro e performance da operação com mais previsibilidade.',
    icon: BarChart3,
  },
];

const benefits = [
  'Arquitetura pensada para hotelaria independente',
  'Base operacional pronta para crescimento comercial',
  'Posicionamento claro para demonstração, implantação e venda',
];

const moduleMatrix = [
  {
    name: 'Reservas',
    audience: 'Login de reservas',
    icon: CalendarRange,
    tone: 'amber',
    objective: 'Vender e organizar a ocupação antes da chegada do hóspede.',
    canDo: [
      'Criar, alterar e cancelar reservas',
      'Consultar disponibilidade por período, UH e categoria',
      'Aplicar tarifa, pacote, origem e garantia da reserva',
      'Controlar no-show, confirmação e previsão de ocupação',
    ],
    missing: [
      'Status comerciais completos da reserva',
      'Pré-pagamento e garantia integrados ao financeiro',
      'Forecast de ocupação mais forte',
      'Regras tarifárias por canal, empresa e temporada',
    ],
  },
  {
    name: 'Hotel / Recepção',
    audience: 'Login de recepção',
    icon: Hotel,
    tone: 'stone',
    objective: 'Operar a hospedagem com controle do check-in ao check-out.',
    canDo: [
      'Localizar reservas e transformar em hospedagem',
      'Executar check-in, check-out e movimentações da estadia',
      'Acompanhar status dos quartos e da hospedagem',
      'Gerenciar conta corrente do hóspede durante a operação',
    ],
    missing: [
      'Mapa operacional de quartos mais robusto',
      'Fluxo de governança com limpeza, inspeção e bloqueio',
      'Conta aberta por UH/hóspede com mais profundidade',
      'Auditoria noturna e fechamentos operacionais',
    ],
  },
  {
    name: 'Faturamento',
    audience: 'Login de faturamento',
    icon: Receipt,
    tone: 'emerald',
    objective: 'Cobrar, faturar, emitir e auditar o financeiro da hospedagem.',
    canDo: [
      'Gerar nota, fatura e títulos da hospedagem',
      'Baixar recebimentos e controlar pendências',
      'Tratar pré-pagamentos, empresas e contas a receber',
      'Conferir documentos emitidos e divergências do período',
    ],
    missing: [
      'NFS-e/RPS com fila de erros e reenvio',
      'Faturamento automático por regra operacional',
      'Conciliação financeira por forma de pagamento',
      'Relatórios de faturado, recebido, cancelado e em aberto',
    ],
  },
];

const crossModuleGoals = [
  'Permissão por ação, não apenas por módulo',
  'Trilha de auditoria entre reserva, hospedagem e faturamento',
  'Dashboards específicos para cada login operacional',
  'Regras de transição entre módulos com bloqueios e aprovações',
];

const executiveRoadmap = [
  {
    title: 'Já temos',
    tone: 'stone',
    items: [
      'Separação operacional por login e função',
      'Base de reservas, check-in/check-out e tarifas',
      'Estrutura inicial de financeiro, auditoria e usuários',
      'Uma arquitetura com cara de PMS e não de sistema genérico',
      'Separação de contexto operacional por setor e responsabilidade',
    ],
  },
  {
    title: 'Em construção',
    tone: 'amber',
    items: [
      'Conexão mais forte entre reserva, hospedagem e faturamento',
      'Dashboards próprios para cada módulo operacional',
      'Conta corrente da hospedagem e fluxo de governança',
      'Mais profundidade na operação diária da recepção',
      'Narrativa comercial mais forte para venda consultiva',
    ],
  },
  {
    title: 'Crítico para vender',
    tone: 'emerald',
    items: [
      'Faturamento com NFS-e, erros fiscais e baixa robusta',
      'Permissões por ação com trilha de auditoria forte',
      'Mapa operacional de quartos realmente confiável',
      'Relatórios gerenciais, financeiros e fiscais de nível profissional',
      'Mais previsibilidade para implantação em novas operações',
    ],
  },
];

const proofPoints = [
  {
    title: 'Menos dependência de controles paralelos',
    description: 'Reservas, recepção e faturamento passam a trabalhar com uma base operacional mais integrada e confiável.',
  },
  {
    title: 'Mais clareza sobre a rotina do hotel',
    description: 'A gestão ganha leitura mais rápida de ocupação, pendências, movimento do dia e responsabilidades por setor.',
  },
  {
    title: 'Mais confiança para vender e implantar',
    description: 'O produto passa a ser percebido como uma plataforma profissional, com estrutura para crescer e padronizar operação.',
  },
];

const objections = [
  {
    question: '“Minha equipe vai ter dificuldade para usar?”',
    answer: 'A proposta do Royal PMS é organizar a operação por contexto de trabalho. Cada login entra no módulo que faz sentido para sua rotina, reduzindo ruído e complexidade.',
  },
  {
    question: '“Serve para uma operação menor?”',
    answer: 'Sim. A arquitetura atende pousadas e hotéis independentes que precisam profissionalizar a gestão sem adotar uma estrutura excessivamente pesada.',
  },
  {
    question: '“O sistema está pronto para crescer?”',
    answer: 'A base foi pensada para evoluir em reservas, operação e faturamento, permitindo amadurecimento gradual sem perder consistência de produto.',
  },
];

const salesArguments = [
  'Separação de módulos por login reforça governança e responsabilidade operacional.',
  'O produto fala com três dores centrais da hotelaria: vender, operar e faturar.',
  'A plataforma reduz improviso e ajuda a criar padrão de trabalho entre setores.',
  'A proposta comercial transmite maturidade mesmo enquanto o produto continua evoluindo.',
];

export default function MarketingLanding() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f2e8_0%,#f1e7d8_45%,#efe4d2_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 rounded-full border border-white/60 bg-white/75 px-5 py-4 shadow-lg shadow-amber-950/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a href="#inicio" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-amber-200 bg-white p-1 shadow-sm">
                <img src="/logo.png" alt="Royal PMS" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-base font-black uppercase tracking-tight text-amber-700">Royal PMS</p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Hospitalidade com controle</p>
              </div>
            </a>

            <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
              <a href="#modulos" className="transition hover:text-amber-700">Módulos</a>
              <a href="#beneficios" className="transition hover:text-amber-700">Benefícios</a>
              <a href="#login" className="transition hover:text-amber-700">Entrar</a>
            </nav>

            <a
              href="#login"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-950 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800"
            >
              Solicitar demonstração
            </a>
          </div>
        </header>

        <main className="flex-1">
          <section id="inicio" className="grid gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700">
                PMS para pousadas, hotéis independentes e operações em crescimento
              </p>
              <h1 className="max-w-4xl font-serif text-5xl leading-none tracking-[-0.04em] text-stone-950 sm:text-6xl lg:text-7xl">
                Um PMS para profissionalizar
                <span className="block text-stone-700">operação, reservas e faturamento em um só ecossistema.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                O Royal PMS foi desenhado para meios de hospedagem que precisam sair da dependência de processos soltos
                e assumir uma rotina mais confiável, escalável e comercialmente preparada.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-700 px-6 text-sm font-semibold text-white shadow-lg shadow-amber-900/20 transition hover:-translate-y-0.5 hover:bg-amber-800"
                >
                  Quero conhecer o sistema
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#modulos"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white/70 px-6 text-sm font-semibold text-stone-800 transition hover:-translate-y-0.5"
                >
                  Ver módulos
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-stone-200 bg-white/70 p-5 shadow-lg shadow-amber-950/5">
                  <p className="text-sm font-bold text-stone-900">Mais controle</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">Operação mais previsível com leitura rápida da hospedagem, da disponibilidade e da rotina do dia.</p>
                </div>
                <div className="rounded-3xl border border-stone-200 bg-white/70 p-5 shadow-lg shadow-amber-950/5">
                  <p className="text-sm font-bold text-stone-900">Mais eficiência operacional</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">Menos retrabalho entre reservas, recepção, governança e faturamento.</p>
                </div>
                <div className="rounded-3xl border border-stone-200 bg-white/70 p-5 shadow-lg shadow-amber-950/5">
                  <p className="text-sm font-bold text-stone-900">Mais capacidade de crescimento</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">Uma base mais sólida para vender melhor, implantar com segurança e escalar a operação.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_28px_90px_rgba(68,37,15,0.12)] backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-800">Painel operacional</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Ao vivo</span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-stone-950 p-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Ocupação</p>
                    <p className="mt-3 text-4xl font-black">84%</p>
                    <p className="mt-3 text-sm leading-6 text-white/70">Indicadores operacionais com leitura imediata para decisões mais rápidas no dia a dia.</p>
                  </div>
                  <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Movimento do dia</p>
                    <div className="mt-4 space-y-3 text-sm text-stone-700">
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <span>Check-ins</span>
                        <strong>17</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <span>Check-outs</span>
                        <strong>13</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                        <span>Diária média</span>
                        <strong>R$ 286</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-stone-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Rotina da operação</p>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-600" />
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Quarto 12 liberado para governança</p>
                        <p className="text-sm text-stone-500">09:20</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Pagamento da reserva 08 conciliado</p>
                        <p className="text-sm text-stone-500">10:05</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-600" />
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Nova reserva criada para o feriado</p>
                        <p className="text-sm text-stone-500">10:42</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-4 hidden rounded-3xl border border-emerald-200 bg-emerald-950 px-5 py-4 text-emerald-50 shadow-2xl lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Financeiro</p>
                <p className="mt-2 text-lg font-bold">Receitas, cobrança e conferência</p>
                <p className="mt-1 max-w-52 text-sm leading-6 text-emerald-100/80">Mais segurança para acompanhar recebimentos, pendências e fechamento com consistência.</p>
              </div>
            </motion.div>
          </section>

          <section id="beneficios" className="py-8 sm:py-12">
            <div className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/65 p-6 shadow-lg shadow-amber-950/5 sm:grid-cols-3">
              {benefits.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/70 p-4">
                  <BadgeCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                  <p className="text-sm font-medium leading-6 text-stone-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="valor" className="py-12 sm:py-16">
            <div className="max-w-4xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700">Prova de valor</p>
              <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] text-stone-950 sm:text-5xl">
                Um produto que organiza a hotelaria onde ela mais perde tempo, controle e previsibilidade.
              </h2>
              <p className="mt-6 text-base leading-8 text-stone-600">
                O Royal PMS nasce com uma proposta simples de entender e forte na prática: dar mais consistência para
                reservas, hospedagem e faturamento sem obrigar a operação a viver de remendo, planilha e retrabalho.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {proofPoints.map((item) => (
                <div key={item.title} className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-lg shadow-amber-950/5">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-stone-500">Resultado percebido</p>
                  <h3 className="mt-4 text-xl font-bold text-stone-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="modulos" className="py-12 sm:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700">Módulos do sistema</p>
              <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] text-stone-950 sm:text-5xl">
                Três frentes críticas da hotelaria integradas em uma mesma plataforma.
              </h2>
              <p className="mt-6 text-base leading-8 text-stone-600">
                A proposta do Royal PMS não é apenas informatizar tarefas. É estruturar reservas, operação e faturamento
                de forma mais madura para apoiar gestão, atendimento e crescimento.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-lg shadow-amber-950/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-stone-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-7 text-white shadow-[0_24px_70px_rgba(20,12,7,0.18)]">
                <div className="flex items-center gap-3">
                  <Hotel className="h-6 w-6 text-amber-400" />
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">Posicionamento comercial</p>
                </div>
                <p className="mt-6 font-serif text-4xl leading-none tracking-[-0.04em] text-white">
                  Um produto para operações que querem trocar improviso por padrão.
                </p>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
                  A linguagem desta página foi construída para sustentar uma venda mais consultiva, mostrando valor operacional,
                  ganho de controle e maturidade de gestão sem prometer além do que o produto ainda vai evoluir.
                </p>
              </div>

              <div className="rounded-[2rem] border border-stone-200 bg-white/80 p-7 shadow-lg shadow-amber-950/5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-stone-500">Estrutura para crescer</p>
                </div>
                <ul className="mt-5 space-y-4 text-sm leading-7 text-stone-600">
                  <li>Mais clareza sobre quem faz o quê dentro da operação.</li>
                  <li>Mais previsibilidade para gestão, recepção e financeiro.</li>
                  <li>Mais consistência para expansão comercial e implantação futura.</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="argumentos" className="py-12 sm:py-16">
            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] border border-stone-200 bg-white/80 p-7 shadow-lg shadow-amber-950/5">
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700">Argumentos de venda</p>
                <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] text-stone-950 sm:text-5xl">
                  Uma narrativa comercial pensada para sustentar demonstração e prospecção.
                </h2>
                <ul className="mt-6 space-y-4 text-sm leading-7 text-stone-700">
                  {salesArguments.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-4">
                      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-7 text-white shadow-[0_24px_70px_rgba(20,12,7,0.18)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-300">Objeções comuns</p>
                <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] text-white sm:text-5xl">
                  Respostas claras para dúvidas que travam a decisão de compra.
                </h2>
                <div className="mt-6 space-y-4">
                  {objections.map((item) => (
                    <div key={item.question} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-sm font-bold text-white">{item.question}</p>
                      <p className="mt-3 text-sm leading-7 text-white/75">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="matriz" className="py-12 sm:py-16">
            <div className="max-w-4xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700">Arquitetura por login</p>
              <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] text-stone-950 sm:text-5xl">
                Cada acesso representa uma responsabilidade operacional distinta.
              </h2>
              <p className="mt-6 text-base leading-8 text-stone-600">
                Em vez de tratar tudo como uma única interface, o Royal PMS pode ser apresentado como uma plataforma
                com acessos específicos para reservas, hotel e faturamento. Isso reforça governança, responsabilidade
                e especialização operacional.
              </p>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-3">
              {moduleMatrix.map((module) => (
                <div key={module.name} className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-lg shadow-amber-950/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">{module.audience}</p>
                      <h3 className="mt-3 text-2xl font-bold text-stone-950">{module.name}</h3>
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        module.tone === 'amber'
                          ? 'bg-amber-100 text-amber-700'
                          : module.tone === 'emerald'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      <module.icon className="h-6 w-6" />
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-stone-600">{module.objective}</p>

                  <div className="mt-6 rounded-3xl bg-stone-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">O que esse login deve fazer</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-700">
                      {module.canDo.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 rounded-3xl border border-dashed border-stone-200 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">O que ainda falta profissionalizar</p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
                      {module.missing.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-stone-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-7 text-white shadow-[0_24px_70px_rgba(20,12,7,0.18)]">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">Objetivos transversais</p>
                <p className="mt-5 font-serif text-4xl leading-none tracking-[-0.04em] text-white">
                  Separar por login só gera valor quando a plataforma também separa contexto, responsabilidade e rastreabilidade.
                </p>
                <ul className="mt-6 space-y-4 text-sm leading-7 text-white/80">
                  {crossModuleGoals.map((goal) => (
                    <li key={goal} className="flex items-start gap-3">
                      <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2rem] border border-stone-200 bg-white/80 p-7 shadow-lg shadow-amber-950/5">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-stone-500">Prioridade de evolução</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-3xl bg-amber-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Fase 1</p>
                    <p className="mt-2 text-sm leading-7 text-stone-700">Clarificar o papel de cada módulo, reforçar os dashboards por setor e conectar melhor reserva, hospedagem e cobrança.</p>
                  </div>
                  <div className="rounded-3xl bg-stone-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Fase 2</p>
                    <p className="mt-2 text-sm leading-7 text-stone-700">Aprofundar permissões, conta corrente da hospedagem, governança e faturamento para reduzir dependência de controles paralelos.</p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Fase 3</p>
                    <p className="mt-2 text-sm leading-7 text-stone-700">Fechar o produto com NFS-e, automações, conciliação, forecast e auditoria completa entre módulos.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="max-w-4xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700">Leitura executiva</p>
                <h3 className="mt-4 font-serif text-3xl leading-none tracking-[-0.04em] text-stone-950 sm:text-4xl">
                  Um resumo direto do produto para guiar evolução e discurso comercial.
                </h3>
              </div>

              <div className="mt-8 grid gap-5 xl:grid-cols-3">
                {executiveRoadmap.map((column) => (
                  <div key={column.title} className="rounded-[2rem] border border-stone-200 bg-white/80 p-6 shadow-lg shadow-amber-950/5">
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${
                        column.tone === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : column.tone === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {column.title}
                    </div>

                    <ul className="mt-5 space-y-4 text-sm leading-7 text-stone-700">
                      {column.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3">
                          <span
                            className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                              column.tone === 'amber'
                                ? 'bg-amber-600'
                                : column.tone === 'emerald'
                                  ? 'bg-emerald-600'
                                  : 'bg-stone-500'
                            }`}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="login" className="py-10 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_0.75fr] lg:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-amber-700">Entrar ou demonstrar</p>
                <h2 className="mt-4 font-serif text-4xl leading-none tracking-[-0.04em] text-stone-950 sm:text-5xl">
                  Uma vitrine comercial para apresentar o produto sem perder o acesso operacional.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600">
                  A página posiciona o Royal PMS como produto. O login mantém o fluxo prático de quem já usa a plataforma no dia a dia.
                </p>

                <div className="mt-8 rounded-[2rem] border border-amber-200 bg-amber-50/80 p-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-5 w-5 text-amber-700" />
                    <div>
                      <p className="text-sm font-bold text-stone-900">Próximo passo recomendado</p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        O próximo passo natural é conectar esta vitrine a um canal real de captação, como WhatsApp, formulário comercial ou CRM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:justify-self-end">
                <Login embedded />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
