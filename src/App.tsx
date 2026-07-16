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
  btPresenciaBeat, btPresenciaOff, btPresenciaList, btPresenciaKick,
  btHistListar, btHistRestaurar,
} from './cloud';
import * as bio from './biometric';

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
  } as Tenant;
}

// Une pedidos locales + nube por id. Los del cliente (movil) que no estan localmente se suman;
// los cambios locales del admin (estado del pedido) ganan sobre los mismos ids.
function mergeOrders(local: Order[], cloud: Order[]): Order[] {
  const m = new Map<string, Order>();
  (cloud || []).forEach((o: any) => { if (o && o.id) m.set(o.id, o); });
  (local || []).forEach((o: any) => { if (o && o.id) m.set(o.id, o); });
  return Array.from(m.values());
}

export default function App() {
  const publicCode = codigoURL();
  const publicMode = !!publicCode;
  const shownCode = publicCode || (getLic()?.codigo || null);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  const [activeRole, setActiveRole] = useState<'customer' | 'admin' | 'collaborator'>('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lastAdminRole, setLastAdminRole] = useState<'admin' | 'collaborator'>('admin');
  const [cargando, setCargando] = useState(!!shownCode);

  const [showLogin, setShowLogin] = useState(false);
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
  const [presence, setPresence] = useState<Record<string, { online: boolean; last_seen: string }>>({});

  const panelRole: 'admin' | 'collaborator' = sessionRoleRef.current === 'colab' ? 'collaborator' : 'admin';

  useEffect(() => {
    if (activeRole === 'admin' || activeRole === 'collaborator') setLastAdminRole(activeRole);
  }, [activeRole]);
  useEffect(() => { if (tenant) setLanguage(tenant.defaultLanguage || 'es'); }, [tenant?.id]);

  const hydrate = (data: any, cod: string) => {
    const tn = data && data.tenant ? { ...tenantDefault(cod), ...data.tenant, id: cod, license: cod } : tenantDefault(cod, getLic()?.nombre_negocio);
    setTenant(tn);
    setProducts(Array.isArray(data?.products) ? data.products : []);
    setOrders(Array.isArray(data?.orders) ? data.orders : []);
    setCollaborators(Array.isArray(data?.collaborators) ? data.collaborators : []);
  };

  useEffect(() => {
    if (!shownCode) { setCargando(false); return; }
    (async () => {
      const r = await btPublica(shownCode);
      if (r && r.ok) {
        setTenant({ ...tenantDefault(shownCode), ...(r.tenant || {}), id: shownCode, license: shownCode } as Tenant);
        setProducts(Array.isArray(r.products) ? r.products : []);
      } else {
        setTenant(tenantDefault(shownCode));
      }
      setCargando(false);
    })();
  }, []);

  useEffect(() => {
    if (publicMode) return;
    bio.bioSupported().then(setBioAvail);
    setBioOn(bio.bioEnabled());
  }, []);

  useEffect(() => {
    if (publicMode || !isLoggedIn || !hydratedRef.current || !tenant) return;
    const cod = getLic()?.codigo;
    if (!cod) return;
    const t = setTimeout(async () => {
      // Merge con la nube antes de guardar, asi no pisamos pedidos nuevos del cliente (movil).
      let ordersToSave = orders;
      try {
        const cloudNow: any = await cloudLoad(cod);
        const cloudOrders = Array.isArray(cloudNow?.orders) ? cloudNow.orders : [];
        ordersToSave = mergeOrders(orders, cloudOrders);
        if (JSON.stringify(ordersToSave) !== JSON.stringify(orders)) setOrders(ordersToSave);
      } catch (e) { /* si falla, guarda lo local */ }
      cloudSave(cod, { tenant, products, orders: ordersToSave, collaborators });
    }, 900);
    return () => clearTimeout(t);
  }, [tenant, products, orders, collaborators]);

  // Refresco periodico: trae pedidos hechos desde otros dispositivos (ej. el cliente en el movil).
  useEffect(() => {
    if (publicMode || !isLoggedIn) return;
    const cod = getLic()?.codigo;
    if (!cod) return;
    let alive = true;
    const iv = setInterval(async () => {
      try {
        const data: any = await cloudLoad(cod);
        const cloudOrders = Array.isArray(data?.orders) ? data.orders : [];
        if (!alive) return;
        setOrders(prev => {
          const merged = mergeOrders(prev, cloudOrders);
          return JSON.stringify(merged) === JSON.stringify(prev) ? prev : merged;
        });
      } catch (e) { /* noop */ }
    }, 12000);
    return () => { alive = false; clearInterval(iv); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const openLogin = () => { setLoginError(''); const lic = getLic(); setLoginStep(lic ? 'credentials' : 'license'); setShowLogin(true); };

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
      if (data && Object.keys(data).length) hydrate(data, cod); else hydrate({}, cod);
    }
    hydratedRef.current = true;
    setIsLoggedIn(true);
    setShowLogin(false);
    setActiveRole(sessionRoleRef.current === 'colab' ? 'collaborator' : 'admin');
    if (cod && sessionRoleRef.current === 'colab') {
      btPresenciaBeat(cod, sessionUserRef.current, true); // limpia "kicked" y marca online
    }
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

  const handleLogout = async () => {
    const cod = getLic()?.codigo;
    try {
      // guardado sincrónico: evita perder cambios (ej. un vendedor recién creado)
      if (cod && hydratedRef.current && tenant) {
        await cloudSave(cod, { tenant, products, orders, collaborators });
      }
      if (cod && sessionRoleRef.current === 'colab') {
        await btPresenciaOff(cod, sessionUserRef.current);
      }
    } catch (e) { /* noop */ }
    signOut(); hydratedRef.current = false;
    setPresence({});
    setIsLoggedIn(false); setActiveRole('customer');
  };

  // El vendedor "late" cada 30s para figurar online. Si el dueño lo desconectó, sale.
  useEffect(() => {
    if (publicMode || !isLoggedIn || sessionRoleRef.current !== 'colab') return;
    const cod = getLic()?.codigo; const usr = sessionUserRef.current;
    if (!cod || !usr) return;
    let stop = false;
    const beat = async () => {
      const r = await btPresenciaBeat(cod, usr);
      if (!stop && r && r.kicked) { alert('El dueño cerró tu sesión.'); handleLogout(); }
    };
    const id = setInterval(beat, 30000);
    return () => { stop = true; clearInterval(id); };
  }, [isLoggedIn]);

  // El dueño consulta la presencia de sus vendedores cada 15s.
  useEffect(() => {
    if (publicMode || !isLoggedIn || sessionRoleRef.current !== 'admin') return;
    const cod = getLic()?.codigo; if (!cod) return;
    let stop = false;
    const load = async () => {
      const list = await btPresenciaList(cod);
      if (stop) return;
      const map: Record<string, { online: boolean; last_seen: string }> = {};
      list.forEach((p: any) => { if (p && p.usuario) map[String(p.usuario).toLowerCase()] = { online: !!p.online, last_seen: p.last_seen }; });
      setPresence(map);
    };
    load();
    const id = setInterval(load, 15000);
    return () => { stop = true; clearInterval(id); };
  }, [isLoggedIn]);

  const handleKickColab = async (usuario: string) => {
    const cod = getLic()?.codigo;
    if (!cod || !usuario) return;
    await btPresenciaKick(cod, usuario);
    setPresence(prev => ({ ...prev, [usuario.toLowerCase()]: { online: false, last_seen: new Date().toISOString() } }));
  };

  // Copias de seguridad: listar y restaurar
  const handleListBackups = async () => {
    const cod = getLic()?.codigo;
    if (!cod) return [];
    return await btHistListar(cod);
  };
  const handleRestoreBackup = async (id: number) => {
    const cod = getLic()?.codigo;
    if (!cod) return false;
    const datos = await btHistRestaurar(cod, id);
    if (!datos) return false;
    hydrate(datos, cod); // recarga la app con la copia restaurada
    return true;
  };

  const roleChange = (role: 'customer' | 'admin' | 'collaborator') => {
    if (!isLoggedIn && (role === 'admin' || role === 'collaborator')) { openLogin(); return; }
    setActiveRole(role);
  };

  const handleCreateOrder = async (order: Order) => {
    if (!isLoggedIn) {
      const cod = publicCode || getLic()?.codigo;
      if (cod) { const ok = await btAgregarPedido(cod, order); if (ok) setOrders(prev => [order, ...prev]); return; }
    }
    setOrders(prev => [order, ...prev]);
  };

  if (cargando) {
    return <div className="bg-neutral-950 text-amber-500 min-h-screen flex items-center justify-center font-mono text-sm">Cargando boutique…</div>;
  }

  if (isLoggedIn && activeRole !== 'customer' && tenant) {
    return (
      <div className="min-h-screen bg-stone-50 text-neutral-900 flex flex-col">
        <div className="flex-1 flex flex-col">
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
            presence={presence}
            onKickColab={handleKickColab}
            onListBackups={handleListBackups}
            onRestoreBackup={handleRestoreBackup}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-neutral-900 flex flex-col relative">
      {tenant ? (
        <NYStorefront
          tenant={tenant}
          products={products}
          onCreateOrder={handleCreateOrder}
          language={language}
          onChangeLanguage={setLanguage}
          isAdminLoggedIn={isLoggedIn}
          lastAdminRole={lastAdminRole}
          onChangeRole={roleChange}
        />
      ) : (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <h1 className="text-lg font-black">Boutique</h1>
            <p className="text-xs text-neutral-400">Activá tu licencia para configurar tu tienda.</p>
            <button onClick={openLogin} className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider">Ingreso / Activar licencia</button>
          </div>
        </div>
      )}

      {showLogin && !isLoggedIn && (
        <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Acceso al Panel</h3>
                <p className="text-[10px] text-neutral-400">Dueño y vendedores</p>
              </div>
              <button onClick={() => setShowLogin(false)} className="text-neutral-400 hover:text-white">✕</button>
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
                  <span className="text-neutral-400 font-semibold">Vendedor:</span> su usuario y clave del panel.
                </p>
                <button type="submit" disabled={loginBusy} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider">
                  {loginBusy ? 'Verificando…' : 'Ingresar'}
                </button>
                <button type="button" onClick={() => setLoginStep('license')} className="w-full text-center text-[10px] text-neutral-400 hover:text-white">Cambiar licencia</button>
              </form>
            )}

            <button type="button" onClick={() => setShowLogin(false)}
              className="w-full mt-1 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 hover:text-amber-400 border-t border-neutral-800 pt-3">
              ← Volver a la tienda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
