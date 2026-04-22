import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import {
  ACCESS_ACTION_LABELS,
  ACCESS_MATRIX_ROLES,
  ACCESS_MATRIX_VIEWS,
  APP_VIEW_LABELS,
  ROLE_HOME_VIEW,
  ROLE_LABELS,
  getAccessActionsForRole,
  getAccessibleViewsForRole,
} from '../lib/profileAccess';

export default function ProfileAccessMatrix() {
  return (
    <section className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-neutral-900" />
            <h2 className="font-bold text-neutral-900">Matriz de Acesso por Perfil</h2>
          </div>
          <p className="text-sm text-neutral-500">
            Validação rápida do módulo inicial e das views liberadas para os perfis comerciais e operacionais.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Módulo Inicial</th>
              {ACCESS_MATRIX_VIEWS.map((view) => (
                <th key={view} className="px-4 py-3 text-center">{APP_VIEW_LABELS[view]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {ACCESS_MATRIX_ROLES.map((role) => {
              const accessible = new Set(getAccessibleViewsForRole(role));

              return (
                <tr key={role} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-bold text-neutral-900">{ROLE_LABELS[role]}</div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wider">{role}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase text-neutral-700">
                      {APP_VIEW_LABELS[ROLE_HOME_VIEW[role]]}
                    </span>
                  </td>
                  {ACCESS_MATRIX_VIEWS.map((view) => {
                    const isAllowed = accessible.has(view);

                    return (
                      <td key={view} className="px-4 py-4 text-center">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                          isAllowed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {isAllowed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ACCESS_MATRIX_ROLES.map((role) => {
          const actions = getAccessActionsForRole(role);

          return (
            <div key={`actions-${role}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-neutral-900">{ROLE_LABELS[role]}</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">{role}</p>
              </div>
              <div className="space-y-2">
                {Object.entries(ACCESS_ACTION_LABELS).map(([key, label]) => {
                  const allowed = actions[key as keyof typeof actions];

                  return (
                    <div key={key} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                      <span className="text-sm text-neutral-600">{label}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                        allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {allowed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {allowed ? 'Liberado' : 'Bloqueado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
