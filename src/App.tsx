/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Tenant, Product, Order, Collaborator } from './types';
import NYStorefront from './components/NYStorefront';
import TenantAdmin from './components/TenantAdmin';
import {
  validarLicencia, asegurarCuentaSeguraDueno, asegurarCuentaSeguraColab,
  cloudLoad, cloudSave, btPublica, btAgregarPedido, signOut,
} from './cloud';
import * as bio from './biometric';

// ── Licencia local ──────────────────────────────────────────────────────
interface Lic { codigo: string; usuario_admin?: string; pass_admin?: string; nombre_negocio?: string; }
function getLic(): Lic | null { try { return JSON.parse(localStorage.getItem('bt_licencia') || 'null'); } catch { return null; } }
function saveLic(l: Lic) { localStorage.setItem('bt_licencia', JSON.stringify(l)); }
function codigoURL(): string | null { try { return new URLSearchParams(window.location.search).get('codigo'); } catch { return null; } }

function tenantDefault(codigo: string, nombre?: string): Tenant {
  return {
    id: codigo, license: codigo, username: '', passwordHash: '',
    name: nombre || 'Mi Boutique', phone: '', email: '', description: '',
    logoUrl: '', heroImage: '', categories: ['Todos', 'Promo', 'Lo Nuevo'],
    createdAt: new Date().toISOString(), seoTitle: '', seoDescription: '', seoKeywords: '',
    defaultLanguage: 'es', address: '', googleMapsUrl: '', phonePrefix: '+54 9 ', currencySymbol: 'ARS',
  };
}

export default function App() {
  const publicCode = codigoURL();
  const publicMode = !!publicCode;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const [activeRole, setActiveRole] = useState<'customer' | 'admin' | 'collaborator'>('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lastAdminRole, setLastAdminRole] = useState<'admin' | 'collaborator'>('admin');
  const [cargandoPublico, setCargandoPublico] = useState(publicMode);

  // Login
  const [loginStep, setLoginStep] = useState<'license' | 'credentials'>('license');
  const [licenseInput, setLicenseInput] = useState('');
  const [userInput, setUserInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const sessionRoleRef = useRef<'admin' | 'colab'>('admin');
  const sessionUserRef = useRef('');
  const hydratedRef = useRef(false);
  const pendingBioRef = useRef<bio.BioCreds | null>(null);
  const [bioAvail, setBioAvail] = useState(false);
  const [bioOn, setBioOn] = useState(false);

  const panelRole: 'admin' | 'collaborator' = sessionRoleRef.current === 'colab' ? 'collaborator' : 'admin';

  useEffect(() => {
    if (activeRole === 'admin' || activeRole === 'collaborator') setLastAdminRole(activeRole);
  }, [activeRole]);
  useEffect(() => { if (tenant) setLanguage(tenant.defaultLanguage || 'es'); }, [tenant?.id]);

  // Hidratar desde la nube / público
  const hydrate = (data: any, cod: string) => {
    const tn = data && data.tenant ? { ...tenantDefault(cod), ...data.tenant, id: cod, license: cod } : tenantDefault(cod, getLic()?.nombre_negocio);
    setTenant(tn);
    setProducts(Array.isArray(data?.products) ? data.products : []);
    setOrders(Array.isArray(data?.orders) ? data.orders : []);
    setCollaborators(Array.isArray(data?.collaborators) ? data.collaborators : []);
  };

  // Modo público: cargar la vidriera por RPC
  useEffect(() => {
    if (!publicMode) return;
    (async () => {
      const r = await btPublica(publicCode!);
      if (r && r.ok) {
        setTenant({ ...tenantDefault(publicCode!), ...(r.tenant || {}), id: publicCode!, license: publicCode! });
        setProducts(Array.isArray(r.products) ? r.products : []);
      } else {
        setTenant(tenantDefault(publicCode!));
      }
      setCargandoPublico(false);
    })();
  }, []);

  // Detectar biometría
  useEffect(() => {
    if (publicMode) return;
    bio.bioSupported().then(setBioAvail);
    setBioOn(bio.bioEnabled());
  }, []);

  // Guardado automático en la nube
  useEffect(() => {
    if (publicMode || !isLoggedIn || !hydratedRef.current || !tenant) return;
    const cod = getLic()?.codigo;
    if (!cod) return;
    const t = setTimeout(() => { cloudSave(cod, { tenant, products, orders, collaborators }); }, 900);
    return () => clearTimeout(t);
  }, [tenant, products, orders, collaborators]);

  // ── Login ──
  const handleLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(''); setLoginBusy(true);
    try {
      const cod = licenseInput.trim().toUpperCase();
      if (!cod.startsWith('BOUT-')) { setLoginError('El código debe empezar con BOUT-'); return; }
      const lic = await validarLicencia(cod);
      if (!lic) { setLoginError('Código no encontrado o vencido. Verificá con el panel CyC.'); return; }
      saveLic({ codigo: cod, usuario_admin: lic.usuario_admin, pass_admin: lic.pass_admin, nombre_negocio: lic.nombre_negocio });
      setLoginStep('credentials');
    } finally { setLoginBusy(false); }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(''); setLoginBusy(true);
    try {
      const lic = getLic();
      if (!lic) { setLoginStep('license'); return; }
      const u = userInput.trim(); const p = passInput;
      if (!u || !p) { setLoginError('Ingresá usuario y contraseña.'); return; }
      const esDueno = (u === lic.usuario_admin && p === lic.pass_admin);
      const r = esDueno
        ? await asegurarCuentaSeguraDueno(u, p, lic.codigo)
        : await asegurarCuentaSeguraColab(u, p, lic.codigo);
      if (!r.ok) { setLoginError(r.msg || 'No se pudo ingresar.'); return; }
      sessionRoleRef.current = esDueno ? 'admin' : 'colab';
      sessionUserRef.current = u;
      pendingBioRef.current = { codigo: lic.codigo, usuario: u, password: p, role: esDueno ? 'admin' : 'colab' };
      await finishLogin();
    } finally { setLoginBusy(false); }
  };

  const finishLogin = async () => {
    const cod = getLic()?.codigo;
    if (cod) {
      const data = await cloudLoad(cod);
      if (data && Object.keys(data).length) hydrate(data, cod);
      else hydrate({}, cod);
    }
    hydratedRef.current = true;
    setIsLoggedIn(true);
    setActiveRole(sessionRoleRef.current === 'colab' ? 'collaborator' : 'admin');
    if (bioAvail && !bio.bioEnabled() && pendingBioRef.current) {
      const creds = pendingBioRef.current;
      setTimeout(async () => {
        if (window.confirm('¿Querés usar tu huella / Face ID para entrar más rápido la próxima vez?')) {
          try { await bio.bioEnable(creds); setBioOn(true); } catch (e) { /* cancelado */ }
        }
        pendingBioRef.current = null;
      }, 700);
    }
  };

  const handleBioLogin = async () => {
    setLoginError('');
    try {
      const creds = await bio.bioLogin();
      if (!creds) return;
      const lic = getLic();
      if (!lic || lic.codigo !== creds.codigo) { setLoginError('La licencia guardada no coincide. Ingresá con licencia y contraseña.'); return; }
      setLoginBusy(true);
      const r = creds.role === 'admin'
        ? await asegurarCuentaSeguraDueno(creds.usuario, creds.password, creds.codigo)
        : await asegurarCuentaSeguraColab(creds.usuario, creds.password, creds.codigo);
      if (!r.ok) { setLoginError(r.msg || 'No se pudo entrar con huella.'); return; }
      sessionRoleRef.current = creds.role;
      sessionUserRef.current = creds.usuario;
      pendingBioRef.current = null;
      await finishLogin();
    } catch (e: any) {
      setLoginError(e && e.name === 'NotAllowedError' ? 'Biometría cancelada.' : 'No se pudo verificar la huella.');
    } finally { setLoginBusy(false); }
  };

  const handleLogout = () => {
    signOut(); hydratedRef.current = false;
    setIsLoggedIn(false); setActiveRole('customer');
  };

  // Crear pedido (público por RPC / preview local)
  const handleCreateOrder = async (order: Order) => {
    if (publicMode) {
      const ok = await btAgregarPedido(publicCode!, order);
      if (ok) setOrders(prev => [order, ...prev]);
      return;
    }
    setOrders(prev => [order, ...prev]);
  };

  // ── Render ──
  if (publicMode) {
    if (cargandoPublico || !tenant) {
      return <div className="bg-neutral-950 text-amber-500 min-h-screen flex items-center justify-center font-mono text-sm">Cargando boutique…</div>;
    }
    return (
      <NYStorefront
        tenant={tenant}
        products={products}
        onCreateOrder={handleCreateOrder}
        language={language}
        onChangeLanguage={setLanguage}
        isAdminLoggedIn={false}
        lastAdminRole={lastAdminRole}
        onChangeRole={() => {}}
      />
    );
  }

  // Dispositivo del negocio: login / panel / preview
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight">Panel de la Boutique</h1>
            <p className="text-[11px] text-neutral-400 mt-1">Acceso seguro</p>
          </div>

          {loginError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] rounded-lg px-3 py-2">{loginError}</div>}

          {bioOn && bioAvail && (
            <button type="button" onClick={handleBioLogin} disabled={loginBusy}
              className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-amber-400 font-bold px-4 py-3 rounded-lg text-xs uppercase tracking-wider border border-amber-500/30">
              🔒 Entrar con huella / Face ID
            </button>
          )}

          {loginStep === 'license' && (
            <form onSubmit={handleLicense} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400">Código de licencia</label>
                <input type="text" required value={licenseInput} onChange={e => setLicenseInput(e.target.value.toUpperCase())}
                  placeholder="BOUT-PREM-2026-XXXX"
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2.5 font-mono tracking-wider focus:outline-none focus:border-amber-500" />
              </div>
              <button type="submit" disabled={loginBusy} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider">
                {loginBusy ? 'Verificando…' : 'Activar licencia'}
              </button>
            </form>
          )}

          {loginStep === 'credentials' && (
            <form onSubmit={handleCredentials} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400">Usuario</label>
                <input type="text" required value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="usuario"
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-[11px] text-neutral-400">Contraseña</label>
                <input type="password" required value={passInput} onChange={e => setPassInput(e.target.value)} placeholder="••••••••"
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500" />
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                <span className="text-neutral-400 font-semibold">Dueño:</span> usuario y contraseña de la licencia.{' '}
                <span className="text-neutral-400 font-semibold">Vendedor:</span> su usuario y clave cargados en el panel.
              </p>
              <button type="submit" disabled={loginBusy} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider">
                {loginBusy ? 'Verificando…' : 'Ingresar'}
              </button>
              <button type="button" onClick={() => setLoginStep('license')} className="w-full text-center text-[10px] text-neutral-400 hover:text-white">Cambiar licencia</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return <div className="bg-neutral-950 text-amber-500 min-h-screen flex items-center justify-center font-mono text-sm">Cargando…</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-neutral-900 flex flex-col">
      <div className="flex-1 flex flex-col">
        {activeRole === 'customer' ? (
          <NYStorefront
            tenant={tenant}
            products={products}
            onCreateOrder={handleCreateOrder}
            language={language}
            onChangeLanguage={setLanguage}
            isAdminLoggedIn={isLoggedIn}
            lastAdminRole={lastAdminRole}
            onChangeRole={setActiveRole}
          />
        ) : (
          <TenantAdmin
            tenant={tenant}
            products={products}
            orders={orders}
            collaborators={collaborators}
            onUpdateTenant={(t) => setTenant(t)}
            onUpdateProducts={setProducts}
            onUpdateCollaborators={setCollaborators}
            onUpdateOrders={setOrders}
            isLoggedIn={true}
            onLogin={() => {}}
            onLogout={handleLogout}
            role={panelRole}
            language={language}
            onChangeLanguage={setLanguage}
            onChangeRole={setActiveRole}
          />
        )}
      </div>
    </div>
  );
}
