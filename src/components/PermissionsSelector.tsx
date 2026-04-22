import React from 'react';
import { UserPermissions } from '../types';
import { Check } from 'lucide-react';
import { DEFAULT_PERMISSIONS } from '../lib/defaultPermissions';

interface PermissionsSelectorProps {
  permissions: UserPermissions;
  onChange: (permissions: UserPermissions) => void;
  role: string;
}

export default function PermissionsSelector({ permissions, onChange, role }: PermissionsSelectorProps) {
  if (!permissions) return <div className="py-2 text-xs text-neutral-400">Carregando permissões...</div>;

  const handleToggle = (key: keyof UserPermissions) => {
    onChange({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  const handleLoadDefaults = () => {
    onChange(DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.client);
  };

  const permissionGroups = [
    {
      title: 'Dashboard',
      permissions: [
        { key: 'canViewDashboard' as keyof UserPermissions, label: 'Visualizar Dashboard' },
      ],
    },
    {
      title: 'Reservas',
      permissions: [
        { key: 'canViewReservations' as keyof UserPermissions, label: 'Visualizar Reservas' },
        { key: 'canCreateReservations' as keyof UserPermissions, label: 'Criar Reservas' },
        { key: 'canEditReservations' as keyof UserPermissions, label: 'Editar Reservas' },
        { key: 'canCancelReservations' as keyof UserPermissions, label: 'Cancelar Reservas' },
        { key: 'canPrintVouchers' as keyof UserPermissions, label: 'Imprimir Vouchers' },
      ],
    },
    {
      title: 'Recepção e Hotel',
      permissions: [
        { key: 'canPerformCheckIn' as keyof UserPermissions, label: 'Realizar Check-in' },
        { key: 'canPerformCheckOut' as keyof UserPermissions, label: 'Realizar Check-out' },
        { key: 'canCreateWalkIn' as keyof UserPermissions, label: 'Criar Walk-in / Passante' },
        { key: 'canManageFolio' as keyof UserPermissions, label: 'Gerenciar Folio e Lançamentos' },
        { key: 'canRemoveFolioCharges' as keyof UserPermissions, label: 'Estornar Lançamentos do Folio' },
        { key: 'canReopenAccounts' as keyof UserPermissions, label: 'Reabrir Contas Fechadas' },
        { key: 'canTransferRoom' as keyof UserPermissions, label: 'Transferir UH' },
        { key: 'canTransferCharges' as keyof UserPermissions, label: 'Transferir Lançamentos' },
        { key: 'canIssueHospitalityStatement' as keyof UserPermissions, label: 'Emitir Nota / Extrato de Hospedagem' },
      ],
    },
    {
      title: 'Eventos',
      permissions: [
        { key: 'canViewEvents' as keyof UserPermissions, label: 'Visualizar Eventos' },
        { key: 'canCreateEvents' as keyof UserPermissions, label: 'Criar Eventos' },
        { key: 'canEditEvents' as keyof UserPermissions, label: 'Editar Eventos' },
        { key: 'canCancelEvents' as keyof UserPermissions, label: 'Cancelar Eventos' },
      ],
    },
    {
      title: 'Hóspedes e Empresas',
      permissions: [
        { key: 'canViewGuests' as keyof UserPermissions, label: 'Visualizar Hóspedes' },
        { key: 'canViewCompanies' as keyof UserPermissions, label: 'Visualizar Empresas' },
        { key: 'canCreateCompanies' as keyof UserPermissions, label: 'Criar Empresas' },
      ],
    },
    {
      title: 'Financeiro',
      permissions: [
        { key: 'canViewFinance' as keyof UserPermissions, label: 'Visualizar Financeiro' },
        { key: 'canUploadFiles' as keyof UserPermissions, label: 'Enviar Arquivos' },
        { key: 'canDownloadFiles' as keyof UserPermissions, label: 'Baixar Arquivos' },
        { key: 'canViewBankAccounts' as keyof UserPermissions, label: 'Ver Contas Bancárias' },
      ],
    },
    {
      title: 'Tarifas e Rastreamento',
      permissions: [
        { key: 'canViewTariffs' as keyof UserPermissions, label: 'Visualizar Tarifas' },
        { key: 'canEditTariffs' as keyof UserPermissions, label: 'Editar Tarifas' },
        { key: 'canViewTracking' as keyof UserPermissions, label: 'Visualizar Rastreamento' },
      ],
    },
    {
      title: 'Administração',
      permissions: [
        { key: 'canViewStaff' as keyof UserPermissions, label: 'Visualizar Funcionários' },
        { key: 'canCreateUsers' as keyof UserPermissions, label: 'Criar Usuários' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Permissões do Usuário</h3>
        <button
          type="button"
          onClick={handleLoadDefaults}
          className="text-xs text-blue-600 underline hover:text-blue-700"
        >
          Carregar padrão para {role}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {permissionGroups.map((group) => (
          <div key={group.title} className="rounded-lg border border-gray-200 p-3">
            <h4 className="mb-2 text-xs font-semibold text-gray-600">{group.title}</h4>
            <div className="space-y-2">
              {group.permissions.map((perm) => (
                <label
                  key={perm.key}
                  className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-gray-50"
                >
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                      permissions[perm.key] ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}
                    onClick={() => handleToggle(perm.key)}
                  >
                    {permissions[perm.key] && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DEFAULT_PERMISSIONS };
