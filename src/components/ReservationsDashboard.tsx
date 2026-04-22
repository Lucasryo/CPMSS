import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { UserProfile, Reservation, Company, ReservationRequest, FiscalFile, AuditLog } from '../types';
import { Plus, Search, Calendar, ChevronLeft, ChevronRight, User, Hash, Clock, CheckCircle, XCircle, MoreVertical, Filter, Loader2, X as CloseIcon, Check, X, LogOut, FileText, Printer, ArrowRightCircle, Receipt, Hotel, History } from 'lucide-react';
import ReservationVoucher from './ReservationVoucher';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logAudit, sendNotification } from '../lib/audit';
import { hasPermission } from '../lib/permissions';

const slugifySegment = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

const buildAutoInvoiceHtml = ({
  companyName,
  companyCnpj,
  guestName,
  reservationCode,
  checkIn,
  checkOut,
  amount,
  dueDate
}: {
  companyName: string;
  companyCnpj?: string;
  guestName: string;
  reservationCode: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  dueDate: string;
}) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Fatura ${reservationCode}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
    .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .muted { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    .value { font-size: 28px; font-weight: 700; color: #b45309; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td, th { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="muted">Fatura Automatica de Checkout</div>
    <h1>Reserva ${reservationCode}</h1>
    <p>Empresa: <strong>${companyName}</strong></p>
    <p>CNPJ: <strong>${companyCnpj || 'Nao informado'}</strong></p>
    <p>Hospede principal: <strong>${guestName}</strong></p>
  </div>

  <div class="card">
    <div class="muted">Resumo</div>
    <div class="value">${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
    <table>
      <tbody>
        <tr>
          <th>Check-in</th>
          <td>${new Date(checkIn + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
        </tr>
        <tr>
          <th>Check-out</th>
          <td>${new Date(checkOut + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
        </tr>
        <tr>
          <th>Vencimento</th>
          <td>${new Date(dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="muted">Documento gerado automaticamente pelo sistema no checkout.</p>
</body>
</html>`;

type ReservationHistoryEntry = {
  id: string;
  timestamp: string;
  stage: 'reservas' | 'recepcao' | 'faturamento';
  title: string;
  description: string;
  actor: string;
};

const HISTORY_STAGE_STYLES: Record<ReservationHistoryEntry['stage'], { label: string; tone: string }> = {
  reservas: { label: 'Reservas', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  recepcao: { label: 'Recepcao', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  faturamento: { label: 'Faturamento', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function ReservationsDashboard({ profile }: { profile: UserProfile }) {
  const [activeSubTab, setActiveSubTab] = useState<'map' | 'requests'>('requests');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationRequests, setReservationRequests] = useState<ReservationRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [files, setFiles] = useState<FiscalFile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [searchTerm, setSearchTerm] = useState('');
  const [voucherReservation, setVoucherReservation] = useState<Reservation | null>(null);
  const [historyReservation, setHistoryReservation] = useState<Reservation | null>(null);
  const canCreateReservation = hasPermission(profile, 'canCreateReservations', ['admin', 'reservations']);
  const canEditReservation = hasPermission(profile, 'canEditReservations', ['admin', 'reservations']);
  const canCancelReservation = hasPermission(profile, 'canCancelReservations', ['admin', 'reservations']);

  // Form state
  const [formData, setFormData] = useState({
    guest_name: '',
    room_number: '',
    check_in: format(new Date(), 'yyyy-MM-dd'),
    check_out: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    status: 'PENDING' as Reservation['status'],
    company_id: '',
    total_amount: 0,
    reservation_code: '',
    cost_center: '',
    tariff: 0,
    category: 'executivo',
    guests_per_uh: 1,
    contact_phone: '',
    iss_tax: 5,
    service_tax: 10,
    payment_method: 'BILLED' as 'BILLED' | 'VIRTUAL_CARD'
  });

  useEffect(() => {
    fetchData();
    const resChannel = supabase.channel('reservations-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchData).subscribe();
    const reqChannel = supabase.channel('requests-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'reservation_requests' }, fetchData).subscribe();
    const fileChannel = supabase.channel('reservation-files-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, fetchData).subscribe();
    const auditChannel = supabase.channel('reservation-audit-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, fetchData).subscribe();
    return () => { 
      supabase.removeChannel(resChannel);
      supabase.removeChannel(reqChannel);
      supabase.removeChannel(fileChannel);
      supabase.removeChannel(auditChannel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    const [resResult, compResult, reqResult, usersResult, filesResult, auditResult] = await Promise.all([
      supabase.from('reservations').select('*').order('check_in'),
      supabase.from('companies').select('*').order('name'),
      supabase.from('reservation_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('files').select('*'),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(300)
    ]);

    if (resResult.data) setReservations(resResult.data);
    if (compResult.data) setCompanies(compResult.data);
    if (reqResult.data) setReservationRequests(reqResult.data);
    if (usersResult.data) setUsers(usersResult.data);
    if (filesResult.data) setFiles(filesResult.data as FiscalFile[]);
    if (auditResult.data) setAuditLogs(auditResult.data as AuditLog[]);
    setLoading(false);
  }

  const generateReservationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RYL-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateReservation) {
      toast.error('Seu perfil não pode criar reservas manuais.');
      return;
    }
    setLoading(true);

    try {
      const resCode = formData.reservation_code || generateReservationCode();
      const { error } = await supabase
        .from('reservations')
        .insert([{ 
          ...formData, 
          reservation_code: resCode,
          created_at: new Date().toISOString() 
        }]);

      if (error) throw error;
      await logAudit({
        user_id: profile.id,
        user_name: profile.name,
        action: 'Reserva criada',
        details: {
          module: 'reservas',
          reservation_code: resCode,
          guest_name: formData.guest_name,
          summary: `Reserva criada para ${formData.guest_name}`,
          check_in: formData.check_in,
          check_out: formData.check_out,
        },
        type: 'create'
      });
      toast.success('Reserva cadastrada com sucesso');
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar reserva');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleApproveReservation = async (request: ReservationRequest) => {
    if (!canEditReservation) {
      toast.error('Seu perfil não pode aprovar solicitações de reserva.');
      return;
    }
    try {
      setLoading(true);
      const { id: _reqId, ...requestData } = request as any;
      const { data: reservation, error: approveError } = await supabase
        .from('reservations')
        .insert([{
          ...requestData,
          status: 'CONFIRMED',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (approveError) throw approveError;
      if (!reservation) throw new Error('Falha ao criar reserva: resposta vazia do servidor.');

      await supabase
        .from('reservation_requests')
        .delete()
        .eq('id', request.id);

      toast.success('Reserva aprovada com sucesso!');
      fetchData();

      const userProfile = users.find(u => u.name === request.requested_by);
      if (userProfile) {
        await sendNotification({
          user_id: userProfile.id,
          title: 'Reserva Aprovada',
          message: `Sua solicita??o de reserva (Ref: ${request.reservation_code}) foi aprovada!`,
          link: '/dashboard'
        });
      }

      await logAudit({
        user_id: profile.id,
        user_name: profile.name,
        action: 'Aprovacao de Reserva',
        details: {
          module: 'reservas',
          reservation_code: request.reservation_code,
          guest_name: request.guest_name,
          requested_by: request.requested_by,
          summary: `Reserva aprovada para ${request.guest_name}`,
        },
        type: 'update'
      });
    } catch (error) {
      console.error("Error approving reservation:", error);
      toast.error('Erro ao aprovar reserva.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReservation = async (requestId: string, code: string, requesterName: string) => {
    if (!canCancelReservation) {
      toast.error('Seu perfil não pode rejeitar solicitações de reserva.');
      return;
    }
    if (!window.confirm('Deseja realmente rejeitar esta solicitação?')) return;
    try {
      setLoading(true);
      await supabase
        .from('reservation_requests')
        .update({ status: 'REJECTED' })
        .eq('id', requestId);

      toast.success('Solicitação rejeitada.');
      fetchData();

      const userProfile = users.find(u => u.name === requesterName);
      if (userProfile) {
        await sendNotification({
          user_id: userProfile.id,
          title: 'Reserva Rejeitada',
          message: `Infelizmente sua solicitação de reserva (Ref: ${code}) não pôde ser atendida.`,
          link: '/dashboard'
        });
      }

      await logAudit({
        user_id: profile.id,
        user_name: profile.name,
        action: 'Rejeição de Reserva',
        details: `Reserva Code: ${code}, Solicitante: ${requesterName}`,
        type: 'update'
      });
    } catch (error) {
      toast.error('Erro ao rejeitar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutReservation = async (reservation: Reservation) => {
    if (reservation.status !== 'CHECKED_IN') {
      toast.error('O faturamento só pode ser iniciado depois que a reserva estiver em hospedagem.');
      return;
    }

    if (hasFinancialDocument(reservation)) {
      toast.error('Já existe documento financeiro vinculado a esta reserva. Revise o fluxo no faturamento.');
      return;
    }
    if (!window.confirm(`Deseja realizar o checkout da reserva ${reservation.reservation_code}? Um arquivo de faturamento será gerado automaticamente.`)) return;
    try {
      setLoading(true);
      const company = companies.find(c => c.id === reservation.company_id);
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const invoiceFileName = `fatura_checkout_${reservation.reservation_code}.html`;
      const companySegment = company?.id || slugifySegment(company?.name || 'particular') || 'particular';
      const period = new Date().toISOString().slice(0, 7);
      const [year, month] = period.split('-');
      const storagePath = `empresas/${companySegment}/${year}/${month}/faturas/${invoiceFileName}`;
      const invoiceHtml = buildAutoInvoiceHtml({
        companyName: company?.name || 'Cliente Particular',
        companyCnpj: company?.cnpj,
        guestName: reservation.guest_name,
        reservationCode: reservation.reservation_code,
        checkIn: reservation.check_in,
        checkOut: reservation.check_out,
        amount: reservation.total_amount,
        dueDate
      });
      const invoiceBlob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });

      const existingStoragePath = getReservationFinanceFiles(reservation).find((file) => file.storage_path)?.storage_path;
      if (existingStoragePath) {
        throw new Error('Já existe documento fiscal ou financeiro armazenado para esta reserva.');
      }

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(storagePath, invoiceBlob);

      if (uploadError) throw uploadError;

      // 1. Create the fiscal file (invoice)
      const fiscalFile = {
        company_id: reservation.company_id,
        original_name: invoiceFileName,
        type: 'FATURA',
        period,
        due_date: dueDate,
        amount: reservation.total_amount,
        status: 'PENDING',
        category: 'Hospedagem',
        uploader_id: profile.id,
        upload_date: new Date().toISOString(),
        storage_path: storagePath,
        viewed_by_client: false,
        created_at: new Date().toISOString(),
        reservation_code: reservation.reservation_code,
        tracking_stage: 'finance',
        tracking_status: 'pending',
        tracking_notes: `Fatura automática gerada no checkout da reserva ${reservation.reservation_code}.`,
        tracking_updated_at: new Date().toISOString(),
        tracking_updated_by: profile.name
      };

      const { error: fileError } = await supabase.from('files').insert([fiscalFile]);
      if (fileError) throw fileError;

      // 2. Update reservation status
      await supabase
        .from('reservations')
        .update({ status: 'CHECKED_OUT' })
        .eq('id', reservation.id);

      const companyUsers = users.filter(u => u.company_id === reservation.company_id);
      for (const user of companyUsers) {
        await sendNotification({
          user_id: user.id,
          title: 'Fatura Gerada no Checkout',
          message: `A reserva ${reservation.reservation_code} foi faturada e o documento já está disponível no portal.`,
          link: '/dashboard'
        });
      }

      toast.success('Checkout realizado e fatura gerada com o código ' + reservation.reservation_code);
      fetchData();

      await logAudit({
        user_id: profile.id,
        user_name: profile.name,
        action: 'Checkout administrativo',
        details: {
          module: 'faturamento',
          reservation_code: reservation.reservation_code,
          guest_name: reservation.guest_name,
          summary: `Fatura automatica gerada no checkout da reserva ${reservation.reservation_code}`,
          storage_path: storagePath,
          amount: reservation.total_amount,
        },
        type: 'update'
      });
    } catch (error) {
      console.error("Error in checkout:", error);
      toast.error('Erro ao realizar checkout.');
    } finally {
      setLoading(false);
    }
  };

  function resetForm() {
    setFormData({
      guest_name: '',
      room_number: '',
      check_in: format(new Date(), 'yyyy-MM-dd'),
      check_out: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      status: 'PENDING',
      company_id: '',
      total_amount: 0,
      reservation_code: '',
      cost_center: '',
      tariff: 0,
      category: 'executivo',
      guests_per_uh: 1,
      contact_phone: '',
      iss_tax: 5,
      service_tax: 10,
      payment_method: 'BILLED'
    });
  }

  const invoiceByReservation = new Map<string, FiscalFile[]>();
  files.forEach((file) => {
    if (!file.reservation_code) return;
    const bucket = invoiceByReservation.get(file.reservation_code) || [];
    bucket.push(file);
    invoiceByReservation.set(file.reservation_code, bucket);
  });

  const getReservationFinanceFiles = (reservation: Pick<Reservation, 'reservation_code'>) =>
    invoiceByReservation.get(reservation.reservation_code) || [];

  const hasFinancialDocument = (reservation: Pick<Reservation, 'reservation_code'>) =>
    getReservationFinanceFiles(reservation).some((file) => !file.is_deleted);

  const canRunAdministrativeCheckout = (reservation: Reservation) =>
    reservation.status === 'CHECKED_IN' && !hasFinancialDocument(reservation);

  const isReservationLockedByFinance = (reservation: Reservation) =>
    hasFinancialDocument(reservation);

  const getTransitionIssue = (reservation: Reservation) => {
    if (reservation.status === 'CHECKED_OUT' && !hasFinancialDocument(reservation)) {
      return 'A hospedagem foi encerrada sem documento financeiro vinculado.';
    }

    if (reservation.status === 'CHECKED_IN' && hasFinancialDocument(reservation)) {
      return 'Já existe documento financeiro ligado a esta hospedagem.';
    }

    if (reservation.status === 'CONFIRMED' && hasFinancialDocument(reservation)) {
      return 'Reserva confirmada com documento financeiro antecipado. Revisar fluxo.';
    }

    return null;
  };

  const getReservationFlow = (reservation: Reservation) => {
    const relatedInvoices = invoiceByReservation.get(reservation.reservation_code) || [];
    const paidInvoice = relatedInvoices.find((file) => file.status === 'PAID');
    const pendingInvoice = relatedInvoices.find((file) => file.status === 'PENDING');
    const cancelledInvoice = relatedInvoices.find((file) => file.status === 'CANCELLED');

    if (paidInvoice) {
      return {
        stageLabel: 'Recebido',
        stageColor: 'bg-emerald-100 text-emerald-700',
        nextStep: 'Fluxo concluído',
        nextModule: 'Financeiro',
        warning: null,
      };
    }

    if (pendingInvoice) {
      return {
        stageLabel: 'Faturado',
        stageColor: 'bg-emerald-100 text-emerald-700',
        nextStep: 'Aguardar baixa e conciliação',
        nextModule: 'Financeiro',
        warning: null,
      };
    }

    if (cancelledInvoice && reservation.status === 'CHECKED_OUT') {
      return {
        stageLabel: 'Fatura cancelada',
        stageColor: 'bg-red-100 text-red-700',
        nextStep: 'Revisar cobrança',
        nextModule: 'Faturamento',
        warning: 'Existe documento cancelado após a hospedagem.',
      };
    }

    switch (reservation.status) {
      case 'PENDING':
        return {
          stageLabel: 'Em análise',
          stageColor: 'bg-amber-100 text-amber-700',
          nextStep: 'Aprovar ou ajustar solicitação',
          nextModule: 'Reservas',
          warning: null,
        };
      case 'CONFIRMED':
        return {
          stageLabel: 'Confirmada',
          stageColor: 'bg-blue-100 text-blue-700',
          nextStep: 'Enviar para check-in',
          nextModule: 'Recepção',
          warning: null,
        };
      case 'CHECKED_IN':
        return {
          stageLabel: 'Hospedado',
          stageColor: 'bg-violet-100 text-violet-700',
          nextStep: 'Fechar hospedagem na recepção',
          nextModule: 'Recepção',
          warning: null,
        };
      case 'CHECKED_OUT':
        return {
          stageLabel: 'Checkout sem faturamento',
          stageColor: 'bg-orange-100 text-orange-700',
          nextStep: 'Gerar cobrança e documento',
          nextModule: 'Faturamento',
          warning: 'A hospedagem foi encerrada, mas ainda não há arquivo financeiro vinculado.',
        };
      case 'CANCELLED':
        return {
          stageLabel: 'Cancelada',
          stageColor: 'bg-red-100 text-red-700',
          nextStep: 'Fluxo encerrado',
          nextModule: 'Reservas',
          warning: null,
        };
      default:
        return {
          stageLabel: reservation.status,
          stageColor: 'bg-neutral-100 text-neutral-700',
          nextStep: 'Revisar fluxo',
          nextModule: 'Operação',
          warning: null,
        };
    }
  };

  const parseAuditDetails = (details: AuditLog['details']) => {
    if (typeof details !== 'string') {
      return details as Record<string, unknown>;
    }

    try {
      return JSON.parse(details) as Record<string, unknown>;
    } catch {
      return { raw: details };
    }
  };

  const getAuditReservationCode = (log: AuditLog) => {
    const parsed = parseAuditDetails(log.details);
    if (typeof parsed.reservation_code === 'string') {
      return parsed.reservation_code;
    }

    if (typeof parsed.raw === 'string') {
      const matched = parsed.raw.match(/Reserva Code:\s*([A-Z0-9-]+)/i);
      return matched?.[1] || null;
    }

    return null;
  };

  const getAuditStage = (log: AuditLog, details: Record<string, unknown>): ReservationHistoryEntry['stage'] => {
    if (details.module === 'reservas') return 'reservas';
    if (details.module === 'recepcao') return 'recepcao';
    if (details.module === 'faturamento') return 'faturamento';

    const action = log.action.toLowerCase();
    if (action.includes('check-in') || action.includes('check-out')) return 'recepcao';
    if (action.includes('fatura') || action.includes('faturamento')) return 'faturamento';
    return 'reservas';
  };

  const buildReservationHistory = (reservation: Reservation): ReservationHistoryEntry[] => {
    const baseEntry: ReservationHistoryEntry = {
      id: `reservation-${reservation.id}`,
      timestamp: reservation.created_at,
      stage: 'reservas',
      title: 'Reserva registrada',
      description: `Reserva aberta para ${reservation.guest_name} com estadia de ${format(new Date(reservation.check_in + 'T12:00:00'), 'dd/MM/yyyy')} a ${format(new Date(reservation.check_out + 'T12:00:00'), 'dd/MM/yyyy')}.`,
      actor: reservation.requested_by || 'Sistema',
    };

    const auditEntries = auditLogs
      .filter((log) => getAuditReservationCode(log) === reservation.reservation_code)
      .map((log) => {
        const parsed = parseAuditDetails(log.details);
        const fallbackText = typeof parsed.raw === 'string' ? parsed.raw : '';

        return {
          id: `audit-${log.id}`,
          timestamp: log.timestamp,
          stage: getAuditStage(log, parsed),
          title: log.action,
          description:
            (typeof parsed.summary === 'string' && parsed.summary) ||
            (typeof parsed.message === 'string' && parsed.message) ||
            fallbackText ||
            'Evento operacional registrado no sistema.',
          actor: log.user_name,
        } satisfies ReservationHistoryEntry;
      });

    const fileEntries = getReservationFinanceFiles(reservation).map((file) => {
      const statusLabel = file.status === 'PAID' ? 'Recebido' : file.status === 'CANCELLED' ? 'Cancelado' : 'Pendente';
      const fileDate = file.proofDate || file.proof_date || file.upload_date || file.uploadDate || reservation.created_at;

      return {
        id: `file-${file.id}`,
        timestamp: fileDate,
        stage: 'faturamento',
        title: `Documento financeiro ${statusLabel}`,
        description: `${file.original_name || file.originalName || 'Fatura'} · ${statusLabel}`,
        actor: file.tracking_updated_by || file.cancelledBy || 'Sistema',
      } satisfies ReservationHistoryEntry;
    });

    const hasCreationAudit = auditEntries.some((entry) =>
      entry.title.toLowerCase().includes('reserva criada') || entry.title.toLowerCase().includes('aprovacao de reserva')
    );

    return [...(hasCreationAudit ? [] : [baseEntry]), ...auditEntries, ...fileEntries].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const filteredReservations = reservations.filter(r => 
    r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.room_number || '').includes(searchTerm) ||
    r.reservation_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    CHECKED_IN: 'bg-green-100 text-green-700',
    CHECKED_OUT: 'bg-neutral-100 text-neutral-600',
    CANCELLED: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmada',
    CHECKED_IN: 'In House',
    CHECKED_OUT: 'Faturada',
    CANCELLED: 'Cancelada'
  };

  const flowSummary = reservations.reduce(
    (acc, reservation) => {
      const flow = getReservationFlow(reservation);
      if (flow.nextModule === 'Recepção') acc.reception += 1;
      if (flow.nextModule === 'Faturamento' || flow.nextModule === 'Financeiro') acc.billing += 1;
      if (flow.warning) acc.alerts += 1;
      return acc;
    },
    { reception: 0, billing: 0, alerts: 0 }
  );

  const reservationHistory = historyReservation ? buildReservationHistory(historyReservation) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Gestao de Reservas</h2>
          <p className="text-sm text-neutral-500">Controle de solicitacoes, ocupacao e faturamento automatico.</p>
        </div>
        <button
          onClick={() => {
            if (!canCreateReservation) {
              toast.error('Seu perfil nao pode criar reservas manuais.');
              return;
            }
            resetForm();
            setIsModalOpen(true);
          }}
          disabled={!canCreateReservation}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="w-4 h-4" />
          Nova Reserva
        </button>
      </div>

      <div className="flex bg-neutral-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'requests' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Solicitacoes em Analise
          {reservationRequests.filter(r => r.status === 'REQUESTED').length > 0 && (
            <span className="w-5 h-5 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center">
              {reservationRequests.filter(r => r.status === 'REQUESTED').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('map')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'map' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Mapa / Reservas Ativas
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por hospede, quarto ou codigo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-600">
        Revise primeiro as solicitacoes pendentes. Depois acompanhe o que ja esta confirmado para recepcao e o que precisa seguir para faturamento.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Proximo modulo</p>
              <p className="mt-2 text-2xl font-black text-neutral-900">{flowSummary.reception}</p>
              <p className="text-xs font-medium text-neutral-500">reservas aguardando recepcao</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Hotel className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Fila financeira</p>
              <p className="mt-2 text-2xl font-black text-neutral-900">{flowSummary.billing}</p>
              <p className="text-xs font-medium text-neutral-500">reservas em faturamento ou baixa</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Alertas de fluxo</p>
              <p className="mt-2 text-2xl font-black text-neutral-900">{flowSummary.alerts}</p>
              <p className="text-xs font-medium text-neutral-500">checkouts sem documento financeiro</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <ArrowRightCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {activeSubTab === 'requests' ? (
          <div className="divide-y divide-neutral-100">
            {reservationRequests.length === 0 ? (
              <div className="p-20 text-center text-neutral-400 italic">Nenhuma solicitacao pendente no momento.</div>
            ) : (
              reservationRequests.map(req => (
                <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900">{req.guest_name}</h4>
                      <p className="text-xs text-neutral-500 font-medium">Solicitado por: {req.requested_by} ({companies.find(c => c.id === req.company_id)?.name})</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">REF: {req.reservation_code}</span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded truncate">{req.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="flex gap-4 border-l border-neutral-100 pl-8">
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Check-in</p>
                        <p className="text-sm font-bold text-neutral-900">{format(new Date(req.check_in + 'T12:00:00'), 'dd/MM/yy')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase">Check-out</p>
                        <p className="text-sm font-bold text-neutral-900">{format(new Date(req.check_out + 'T12:00:00'), 'dd/MM/yy')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => handleApproveReservation(req)}
                        disabled={!canEditReservation}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        title="Aprovar Reserva"
                       >
                         <Check className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleRejectReservation(req.id!, req.reservation_code, req.requested_by!)}
                        disabled={!canCancelReservation}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        title="Rejeitar Solicitacao"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Ref/Quarto</th>
                  <th className="px-6 py-4">Hospede</th>
                  <th className="px-6 py-4">Estadia</th>
                  <th className="px-6 py-4">Empresa / Faturamento</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Fluxo Operacional</th>
                  <th className="px-6 py-4 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-neutral-400 italic">Nenhuma reserva encontrada para os criterios de busca.</td>
                  </tr>
                ) : filteredReservations.map(res => (
                  <tr key={res.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase leading-none mb-1">{res.reservation_code}</span>
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-neutral-400" />
                          <span className="text-sm font-bold text-neutral-900">{res.room_number || '---'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-900">{res.guest_name}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-medium">{res.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">In</span>
                          <span className="text-xs font-medium">{format(new Date(res.check_in + 'T12:00:00'), 'dd/MM')}</span>
                        </div>
                        <div className="h-px w-4 bg-neutral-200" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">Out</span>
                          <span className="text-xs font-medium">{format(new Date(res.check_out + 'T12:00:00'), 'dd/MM')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-neutral-600">
                        {companies.find(c => c.id === res.company_id)?.name || 'Particular'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${statusColors[res.status]}`}>
                        {statusLabels[res.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const flow = getReservationFlow(res);
                        const transitionIssue = getTransitionIssue(res);
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${flow.stageColor}`}>
                                {flow.stageLabel}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                {flow.nextModule}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-neutral-600">{flow.nextStep}</p>
                            {flow.warning && (
                              <p className="text-[11px] font-medium text-amber-700">{flow.warning}</p>
                            )}
                            {transitionIssue && !flow.warning && (
                              <p className="text-[11px] font-medium text-amber-700">{transitionIssue}</p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isReservationLockedByFinance(res) && (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold uppercase text-amber-700">
                            Travado pelo faturamento
                          </span>
                        )}
                        <button
                          onClick={() => setHistoryReservation(res)}
                          className="p-2 text-neutral-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                          title="Ver historico da reserva"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setVoucherReservation(res)}
                          className="p-2 text-neutral-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="Imprimir Voucher"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {res.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => handleCheckoutReservation(res)}
                            disabled={!canRunAdministrativeCheckout(res)}
                            className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
                            title="Checkout administrativo / gerar faturamento"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          disabled={isReservationLockedByFinance(res)}
                          title={isReservationLockedByFinance(res) ? 'Reserva bloqueada após vínculo financeiro.' : 'Ações adicionais'}
                          className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {voucherReservation && (
        <ReservationVoucher
          reservation={voucherReservation}
          company={companies.find(c => c.id === voucherReservation.company_id)}
          onClose={() => setVoucherReservation(null)}
        />
      )}

      <AnimatePresence>
        {historyReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-3xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-neutral-100 p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-400">Historico operacional</p>
                  <h3 className="mt-2 text-xl font-black text-neutral-900">{historyReservation.reservation_code}</h3>
                  <p className="text-sm text-neutral-500">{historyReservation.guest_name}</p>
                </div>
                <button
                  onClick={() => setHistoryReservation(null)}
                  className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
                {reservationHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
                    Nenhum evento rastreavel foi encontrado para esta reserva ainda.
                  </div>
                ) : (
                  reservationHistory.map((entry) => {
                    const stageStyle = HISTORY_STAGE_STYLES[entry.stage];

                    return (
                      <div key={entry.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${stageStyle.tone}`}>
                                {stageStyle.label}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                                {new Date(entry.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-neutral-900">{entry.title}</h4>
                            <p className="text-sm text-neutral-600">{entry.description}</p>
                          </div>
                          <div className="rounded-2xl bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-500">
                            Responsavel: <span className="font-bold text-neutral-700">{entry.actor}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-neutral-900">Nova Reserva Manual</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full"><CloseIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Hóspede Principal</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input required value={formData.guest_name} onChange={e => setFormData({ ...formData, guest_name: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" placeholder="Nome completo" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Número do Quarto</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input required value={formData.room_number} onChange={e => setFormData({ ...formData, room_number: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" placeholder="Ex: 101" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Check-in</label>
                    <input type="date" required value={formData.check_in} onChange={e => setFormData({ ...formData, check_in: e.target.value })} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Check-out</label>
                    <input type="date" required value={formData.check_out} onChange={e => setFormData({ ...formData, check_out: e.target.value })} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Empresa / Convênio</label>
                    <select value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
                      <option value="">Particular (Sem Empresa)</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Tarifa Diária (R$)</label>
                    <input type="number" step="0.01" value={formData.tariff} onChange={e => setFormData({ ...formData, tariff: parseFloat(e.target.value) })} className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-neutral-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-bold text-neutral-600">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-neutral-900/20 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    Cadastrar e Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
