/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tenant } from '../types';
import { Sparkles, Store, Shield, Users, RefreshCw, Key, Plus, Languages } from 'lucide-react';

interface TenantHubProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenantId: string) => void;
  activeRole: 'customer' | 'admin' | 'collaborator';
  onChangeRole: (role: 'customer' | 'admin' | 'collaborator') => void;
  onRegisterTenant: (newTenant: Tenant) => void;
  isLoggedIn: boolean;
  onLogoutAdmin: () => void;
  language: 'es' | 'en';
  onChangeLanguage: (lang: 'es' | 'en') => void;
}

export default function TenantHub({
  tenants,
  activeTenant,
  onSelectTenant,
  activeRole,
  onChangeRole,
  onRegisterTenant,
  isLoggedIn,
  onLogoutAdmin,
  language,
  onChangeLanguage,
}: TenantHubProps) {
  const [showRegModal, setShowRegModal] = useState(false);
  const [newLicense, setNewLicense] = useState('NY-CHELSEA-5511');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) return;

    const id = newName.toLowerCase().replace(/\s+/g, '-');
    const newTenant: Tenant = {
      id,
      license: newLicense,
      username: newUsername,
      passwordHash: newPassword,
      name: newName,
      phone: '+1 (212) 555-0100',
      email: `contact@${id}.com`,
      description: 'Una nueva boutique de lujo diseñada con la excelencia y el pulso vibrante de la ciudad de Nueva York.',
      logoUrl: newName.toUpperCase(),
      heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
      categories: ['Todos', 'Promo', 'Lo Nuevo', 'Zapatos'],
      createdAt: new Date().toISOString(),
      seoTitle: `${newName} | Calzado Fino New York`,
      seoDescription: 'Boutique premium de calzado y accesorios de alta costura.',
      seoKeywords: 'zapatos, New York, boutique, diseño, calzado premium'
    };

    onRegisterTenant(newTenant);
    setShowRegModal(false);
    // Reset fields
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewLicense('NY-NEW-' + Math.floor(1000 + Math.random() * 9000));
  };

  return (
    <div id="tenant-hub-panel" className="bg-neutral-900 text-neutral-100 border-b border-neutral-800 sticky top-0 z-50 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tenant Selector and Register Option */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-amber-500 font-sans tracking-wide text-xs uppercase font-semibold">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Multi-Tenant Hub</span>
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <label htmlFor="tenant-select" className="text-xs text-neutral-400 font-medium">Boutique:</label>
            <select
              id="tenant-select"
              value={activeTenant.id}
              onChange={(e) => onSelectTenant(e.target.value)}
              className="bg-neutral-800 text-neutral-100 text-xs rounded border border-neutral-700 py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.license})
                </option>
              ))}
            </select>
          </div>

          <button
            id="register-tenant-btn"
            onClick={() => setShowRegModal(true)}
            className="flex items-center gap-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium px-2 py-1 rounded transition border border-neutral-700/60"
          >
            <Plus className="w-3 h-3" />
            <span>Crear Inquilino</span>
          </button>
        </div>

        {/* Right: Role Navigation (Customer vs Admin vs Collaborator) & Language Toggle */}
        <div className="flex flex-wrap items-center gap-3.5 self-end md:self-auto">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded p-0.5">
            <Languages className="w-3.5 h-3.5 text-neutral-400 mx-1.5" />
            <button
              id="lang-es-btn"
              type="button"
              onClick={() => onChangeLanguage('es')}
              className={`px-2 py-1 text-[10px] font-mono uppercase font-bold rounded transition-all ${
                language === 'es'
                  ? 'bg-amber-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-stone-200'
              }`}
            >
              Castellano
            </button>
            <button
              id="lang-en-btn"
              type="button"
              onClick={() => onChangeLanguage('en')}
              className={`px-2 py-1 text-[10px] font-mono uppercase font-bold rounded transition-all ${
                language === 'en'
                  ? 'bg-amber-500 text-neutral-950'
                  : 'text-neutral-400 hover:text-stone-200'
              }`}
            >
              English
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-800 hidden md:block"></div>

          <span className="text-xs text-neutral-400 mr-1 hidden sm:inline">Ver como:</span>
          
          <div className="inline-flex rounded-md p-0.5 bg-neutral-950 border border-neutral-800" role="group">
            <button
              id="role-customer-btn"
              onClick={() => onChangeRole('customer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                activeRole === 'customer'
                  ? 'bg-neutral-100 text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Página Pública (Cliente)</span>
            </button>

            <button
              id="role-admin-btn"
              onClick={() => onChangeRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                activeRole === 'admin'
                  ? 'bg-neutral-100 text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin ({isLoggedIn ? 'Online' : 'Ingresar'})</span>
            </button>

            <button
              id="role-collaborator-btn"
              onClick={() => onChangeRole('collaborator')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                activeRole === 'collaborator'
                  ? 'bg-neutral-100 text-neutral-900 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Colaborador</span>
            </button>
          </div>
        </div>
      </div>

      {/* Register Tenant Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-base font-semibold text-neutral-100 mb-2 font-sans tracking-tight">
              Registrar Nuevo Inquilino (Boutique)
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Crea una licencia y credenciales para simular un comercio independiente dentro de la plataforma.
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Licencia de Comercio</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    className="w-full bg-neutral-950 text-neutral-200 text-xs rounded border border-neutral-800 p-2.5 pl-8 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  <Key className="w-4 h-4 text-neutral-600 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre de la Boutique</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fifth Avenue Atelier"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-neutral-950 text-neutral-200 text-xs rounded border border-neutral-800 p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Usuario Admin</label>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-neutral-950 text-neutral-200 text-xs rounded border border-neutral-800 p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-neutral-950 text-neutral-200 text-xs rounded border border-neutral-800 p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs rounded font-semibold transition"
                >
                  Crear Inquilino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
