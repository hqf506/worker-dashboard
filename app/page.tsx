'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Order = {
  id: number;
  receipt_number: string;
  customer_name: string | null;
  phone: string | null;
  branch: string | null;
  status: string;
  created_at: string;
};

type Role = 'admin' | 'worker';
type Language = 'ar' | 'en';
type WorkerAction = '' | 'reset-password' | 'change-role' | 'save-settings' | 'delete-user';
type OrderTab = 'all' | 'new' | 'ready';
type PageView = 'orders' | 'workers' | 'create-worker';

type Profile = {
  id: string;
  email: string;
  username?: string | null;
  full_name: string;
  role: Role;
  language?: Language | null;
  branch?: string | null;
  created_at?: string;
};

const translations = {
  ar: {
    loading: 'جاري التحميل...',
    loadingProfile: 'جاري تجهيز الحساب...',
    login: 'تسجيل الدخول',
    panel: 'لوحة العامل والإدارة',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    enterCredentials: 'أدخل اسم المستخدم وكلمة المرور',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    loginError: 'فشل تسجيل الدخول',
    loginButton: 'دخول',
    loggingIn: 'جاري الدخول...',
    logout: 'تسجيل خروج',
    dashboardAdmin: 'لوحة الأدمن',
    dashboardWorker: 'لوحة العامل',
    titleAdmin: 'إدارة الطلبات والعمال',
    titleWorker: 'لوحة العامل',
    openOrders: 'الطلبات المفتوحة',
    newOrders: 'طلبات جديدة',
    readyOrders: 'تم التجهيز',
    deliveredOrders: 'تم التسليم',
    showClosedOrders: 'عرض الطلبات المغلقة',
    hideClosedOrders: 'إخفاء الطلبات المغلقة',
    restoreOrder: 'إرجاع الطلب',
    restoreReady: 'إرجاع إلى تم التجهيز',
    refreshOrders: 'تحديث الطلبات',
    refreshing: 'جاري التحديث...',
    addWorker: 'إضافة عامل جديد',
    addWorkerDesc: 'من هنا تقدر تضيف يوزر جديد للعامل مع كلمة مرور.',
    workerName: 'اسم العامل',
    addWorkerBtn: 'إضافة العامل',
    addingWorker: 'جاري الإضافة...',
    currentWorkers: 'العمال الحاليون',
    name: 'الاسم',
    userName: 'اسم المستخدم',
    role: 'الصلاحية',
    language: 'اللغة',
    branch: 'الفرع',
    newPassword: 'كلمة مرور جديدة',
    actions: 'الإجراء',
    worker: 'عامل',
    admin: 'أدمن',
    resetPassword: 'إعادة تعيين كلمة المرور',
    changingPassword: 'جاري التغيير...',
    changeRole: 'تغيير الصلاحية',
    changingRole: 'جاري التغيير...',
    saveBranchLang: 'حفظ اللغة والفرع',
    saving: 'جاري الحفظ...',
    deleteUser: 'حذف اليوزر',
    deleting: 'جاري الحذف...',
    noWorkers: 'لا يوجد عمال حالياً',
    currentOrders: 'الطلبات الحالية',
    currentOrdersDesc: 'الطلبات المسلمة تختفي من صفحة العامل تلقائيًا.',
    searchPlaceholder: 'ابحث برقم الفاتورة أو اسم العميل أو الجوال أو الفرع',
    invoice: 'رقم الفاتورة',
    customer: 'العميل',
    phone: 'الجوال',
    status: 'الحالة',
    ready: 'تم التجهيز',
    delivered: 'تم التسليم',
    updating: 'جاري التحديث...',
    noOrders: 'لا توجد طلبات حالياً',
    noMatchingOrders: 'لا توجد نتائج مطابقة أو لا توجد طلبات مفتوحة',
    noProfile: 'لم يتم العثور على بيانات المستخدم في profiles',
    fillAllWorkerFields: 'عبّ جميع حقول العامل',
    minPassword: 'كلمة المرور لازم تكون 6 أحرف أو أكثر',
    updateStatusSuccess: 'تم تحديث حالة الطلب',
    updateStatusError: 'تعذر تحديث حالة الطلب',
    workerCreated: 'تم إنشاء العامل بنجاح',
    workerCreateError: 'فشل إنشاء العامل',
    resetPasswordEmpty: 'أدخل كلمة مرور جديدة للعامل',
    resetPasswordSuccess: 'تم تغيير كلمة مرور العامل بنجاح',
    resetPasswordError: 'فشل إعادة تعيين كلمة المرور',
    roleSaved: 'تم تحديث الصلاحية بنجاح',
    roleSaveError: 'تعذر تحديث الصلاحية',
    branchLangSaved: 'تم حفظ اللغة والفرع بنجاح',
    branchLangError: 'تعذر حفظ اللغة والفرع',
    userDeleted: 'تم حذف المستخدم بنجاح',
    userDeleteError: 'تعذر حذف المستخدم',
    confirmDelete: 'هل أنت متأكد من حذف هذا المستخدم؟',
    confirmRoleChange: 'هل أنت متأكد من تغيير الصلاحية؟',
    safaBranch: 'فرع الصحافة',
    rawdaBranch: 'فرع الروضة',
    allBranches: 'كل الفروع',
    arabic: 'العربية',
    english: 'English',
    newStatus: 'جديد',
    readyStatus: 'تم التجهيز',
    closedStatus: 'تم التسليم',
    selectAction: 'اختر الإجراء',
    execute: 'تنفيذ',
    executing: 'جاري التنفيذ...',
    resetPasswordAction: 'إعادة تعيين كلمة المرور',
    changeRoleAction: 'تغيير الصلاحية',
    saveSettingsAction: 'حفظ اللغة والفرع',
    deleteUserAction: 'حذف اليوزر',
    selectActionFirst: 'اختر الإجراء أولاً',
    email: 'الإيميل',
    languageOutside: 'اللغة',
  },
  en: {
    loading: 'Loading...',
    loadingProfile: 'Preparing account...',
    login: 'Login',
    panel: 'Worker & Admin Panel',
    username: 'Username',
    password: 'Password',
    enterCredentials: 'Enter username and password',
    loginSuccess: 'Logged in successfully',
    loginError: 'Login failed',
    loginButton: 'Login',
    loggingIn: 'Signing in...',
    logout: 'Logout',
    dashboardAdmin: 'Admin Panel',
    dashboardWorker: 'Worker Panel',
    titleAdmin: 'Orders & Workers Management',
    titleWorker: 'Worker Dashboard',
    openOrders: 'Open Orders',
    newOrders: 'New Orders',
    readyOrders: 'Ready',
    deliveredOrders: 'Delivered',
    showClosedOrders: 'Show Closed Orders',
    hideClosedOrders: 'Hide Closed Orders',
    restoreOrder: 'Restore Order',
    restoreReady: 'Restore to Ready',
    refreshOrders: 'Refresh Orders',
    refreshing: 'Refreshing...',
    addWorker: 'Add New User',
    addWorkerDesc: 'Create a new worker user with password.',
    workerName: 'Full Name',
    addWorkerBtn: 'Add User',
    addingWorker: 'Adding...',
    currentWorkers: 'Current Users',
    name: 'Name',
    userName: 'Username',
    role: 'Role',
    language: 'Language',
    branch: 'Branch',
    newPassword: 'New Password',
    actions: 'Actions',
    worker: 'Worker',
    admin: 'Admin',
    resetPassword: 'Reset Password',
    changingPassword: 'Changing...',
    changeRole: 'Change Role',
    changingRole: 'Changing...',
    saveBranchLang: 'Save Branch & Language',
    saving: 'Saving...',
    deleteUser: 'Delete User',
    deleting: 'Deleting...',
    noWorkers: 'No workers found',
    currentOrders: 'Current Orders',
    currentOrdersDesc: 'Delivered orders are hidden automatically.',
    searchPlaceholder: 'Search by invoice, customer, phone, or branch',
    invoice: 'Invoice',
    customer: 'Customer',
    phone: 'Phone',
    status: 'Status',
    ready: 'Ready',
    delivered: 'Delivered',
    updating: 'Updating...',
    noOrders: 'No orders available',
    noMatchingOrders: 'No matching or open orders found',
    noProfile: 'User profile was not found in profiles',
    fillAllWorkerFields: 'Fill in all worker fields',
    minPassword: 'Password must be at least 6 characters',
    updateStatusSuccess: 'Order status updated successfully',
    updateStatusError: 'Unable to update order status',
    workerCreated: 'Worker created successfully',
    workerCreateError: 'Failed to create worker',
    resetPasswordEmpty: 'Enter a new password for the worker',
    resetPasswordSuccess: 'Worker password updated successfully',
    resetPasswordError: 'Failed to reset password',
    roleSaved: 'Role updated successfully',
    roleSaveError: 'Unable to update role',
    branchLangSaved: 'Branch and language saved successfully',
    branchLangError: 'Unable to save branch and language',
    userDeleted: 'User deleted successfully',
    userDeleteError: 'Unable to delete user',
    confirmDelete: 'Are you sure you want to delete this user?',
    confirmRoleChange: 'Are you sure you want to change the role?',
    safaBranch: 'Sahafa Branch',
    rawdaBranch: 'Rawda Branch',
    allBranches: 'All Branches',
    arabic: 'العربية',
    english: 'English',
    newStatus: 'New',
    readyStatus: 'Ready',
    closedStatus: 'Delivered',
    selectAction: 'Select Action',
    execute: 'Execute',
    executing: 'Executing...',
    resetPasswordAction: 'Reset Password',
    changeRoleAction: 'Change Role',
    saveSettingsAction: 'Save Language & Branch',
    deleteUserAction: 'Delete User',
    selectActionFirst: 'Select an action first',
    email: 'Email',
    languageOutside: 'Language',
  },
} as const;

const normalizeUsername = (value: string) => value.trim().toLowerCase();

const usernameToEmail = (username: string) => {
  const clean = normalizeUsername(username);
  return clean.includes('@') ? clean : `${clean}@worker.local`;
};

const safeText = (value: string | null | undefined) => (value ?? '').toString();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const UI_LANGUAGE_STORAGE_KEY = 'worker-dashboard-ui-language';

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'ar';
  const savedLang = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return savedLang === 'en' || savedLang === 'ar' ? savedLang : 'ar';
};

const applyDocumentLanguage = (lang: Language) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}


function formatOrderAge(dateString: string, lang: Language) {
  const createdAt = new Date(dateString).getTime();
  if (Number.isNaN(createdAt)) return '-';

  const diffMs = Math.max(Date.now() - createdAt, 0);
  const totalMinutes = Math.floor(diffMs / 60000);

  if (totalMinutes < 1) {
    return lang === 'ar' ? 'الآن' : 'Just now';
  }

  if (totalMinutes < 60) {
    return lang === 'ar' ? `قبل ${totalMinutes} دقيقة` : `${totalMinutes} min ago`;
  }

  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) {
    return lang === 'ar' ? `قبل ${hours} ساعة` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return lang === 'ar' ? `قبل ${days} يوم` : `${days}d ago`;
}

function formatOrderTime(dateString: string, lang: Language) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}


export default function Home() {
  const [uiLanguage, setUiLanguage] = useState<Language>(() => getStoredLanguage());

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [pageView, setPageView] = useState<PageView>('orders');

  useEffect(() => {
    if (profile?.role === 'worker' && pageView !== 'orders') {
      setPageView('orders');
    }
  }, [profile?.role, pageView]);
  const [orderTab, setOrderTab] = useState<OrderTab>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showClosedOrders, setShowClosedOrders] = useState(false);
  const [clockTick, setClockTick] = useState(Date.now());

  const [authLoading, setAuthLoading] = useState(true);
  const [bootLoading, setBootLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [resettingWorkerId, setResettingWorkerId] = useState<string | null>(null);
  const [savingWorkerId, setSavingWorkerId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [deletingWorkerId, setDeletingWorkerId] = useState<string | null>(null);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [workerName, setWorkerName] = useState('');
  const [workerUsername, setWorkerUsername] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');

  const [resetPasswordMap, setResetPasswordMap] = useState<Record<string, string>>({});
  const [workerRoleMap, setWorkerRoleMap] = useState<Record<string, Role>>({});
  const [workerLanguageMap, setWorkerLanguageMap] = useState<Record<string, Language>>({});
  const [workerBranchMap, setWorkerBranchMap] = useState<Record<string, string>>({});
  const [workerActionMap, setWorkerActionMap] = useState<Record<string, WorkerAction>>({});

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const fetchingOrdersRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const savedLang = getStoredLanguage();
    setUiLanguage(savedLang);
    applyDocumentLanguage(savedLang);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, uiLanguage);
    }
    applyDocumentLanguage(uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    if (!profile?.id) return;

    const storedLang = getStoredLanguage();

    if (profile.language !== 'ar' && profile.language !== 'en') {
      return;
    }

    if (storedLang !== profile.language) {
      setUiLanguage(storedLang);
    }
  }, [profile?.id, profile?.language]);

  useEffect(() => {
    if (profile?.role !== 'worker') return;

    const interval = window.setInterval(() => {
      setClockTick(Date.now());
    }, 60000);

    return () => window.clearInterval(interval);
  }, [profile?.role]);


  const currentLang: Language = uiLanguage;

  const t = translations[currentLang];
  const isArabic = currentLang === 'ar';

  const statusLabels = useMemo<Record<string, string>>(
    () => ({
      new: t.newStatus,
      ready: t.readyStatus,
      closed: t.closedStatus,
    }),
    [t.newStatus, t.readyStatus, t.closedStatus]
  );

  const statusStyles: Record<string, string> = {
    new: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    ready: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    closed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
    }, 3500);
  };

  const setAppLanguage = (lang: Language) => {
    setUiLanguage(lang);
  };


  const hydrateWorkerMaps = (list: Profile[]) => {
    const nextRoleMap: Record<string, Role> = {};
    const nextLanguageMap: Record<string, Language> = {};
    const nextBranchMap: Record<string, string> = {};
    const nextActionMap: Record<string, WorkerAction> = {};

    list.forEach((w) => {
      nextRoleMap[w.id] = w.role;
      nextLanguageMap[w.id] = w.language === 'en' ? 'en' : 'ar';
      nextBranchMap[w.id] = w.branch || '';
      nextActionMap[w.id] = '';
    });

    setWorkerRoleMap(nextRoleMap);
    setWorkerLanguageMap(nextLanguageMap);
    setWorkerBranchMap(nextBranchMap);
    setWorkerActionMap(nextActionMap);
  };

  const fetchProfileOnce = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    return { data: (data as Profile | null) ?? null, error: null };
  };

  const fetchProfileWithRetry = async (
    userId: string,
    useRetry = true,
    showLoader = false
  ) => {
    if (showLoader) setProfileLoading(true);

    try {
      const delays = useRetry ? [0, 400, 900] : [0];

      for (let i = 0; i < delays.length; i++) {
        if (delays[i] > 0) await sleep(delays[i]);

        const { data, error } = await fetchProfileOnce(userId);

        if (data) {
          setProfile(data);
          return data;
        }

        if (error) {
          console.error('PROFILE FETCH ERROR:', error);
        }
      }

      setProfile(null);
      return null;
    } finally {
      if (showLoader) setProfileLoading(false);
    }
  };

  const fetchOrders = async (silent = false, profileOverride?: Profile | null) => {
    if (fetchingOrdersRef.current) return;

    fetchingOrdersRef.current = true;
    if (!silent) setRefreshingOrders(true);

    try {
      const activeProfile = profileOverride ?? profile;
      let query = supabase.from('orders').select('*').order('id', { ascending: false });

      if (activeProfile?.role === 'worker' && activeProfile?.branch) {
        query = query.eq('branch', activeProfile.branch);
      }

      const { data, error } = await query;

      if (error) {
        showMessage('error', t.updateStatusError);
        return;
      }

      if (mountedRef.current) {
        setOrders((data as Order[]) || []);
      }
    } finally {
      fetchingOrdersRef.current = false;
      if (!silent && mountedRef.current) setRefreshingOrders(false);
    }
  };

  const fetchWorkers = async (currentProfile?: Profile | null) => {
    const activeProfile = currentProfile ?? profile;
    if (activeProfile?.role !== 'admin') return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showMessage('error', isArabic ? 'تعذر تحميل قائمة المستخدمين' : 'Unable to load users list');
      return;
    }

    const list = ((data as Profile[]) || []).filter((x) => x.id !== activeProfile.id);
    setWorkers(list);
    hydrateWorkerMaps(list);
  };

  const login = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      showMessage('error', t.enterCredentials);
      return;
    }

    setLoginLoading(true);
    setProfile(null);

    try {
      const fakeEmail = usernameToEmail(loginUsername);
      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: loginPassword,
      });

      if (error) {
        showMessage('error', error.message || t.loginError);
        return;
      }

      showMessage('success', t.loginSuccess);
    } catch {
      showMessage('error', t.loginError);
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrders([]);
    setWorkers([]);
    showMessage('success', isArabic ? 'تم تسجيل الخروج' : 'Logged out successfully');
  };

  const updateStatus = async (id: number, status: string) => {
    setBusyId(id);

    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);

      if (error) {
        showMessage('error', t.updateStatusError);
        return;
      }

      showMessage('success', t.updateStatusSuccess);
      await fetchOrders(true);
    } finally {
      setBusyId(null);
    }
  };

  const createWorker = async () => {
    if (profile?.role !== 'admin' || !user) return;

    const cleanName = workerName.trim();
    const cleanUsername = normalizeUsername(workerUsername);
    const cleanPassword = workerPassword.trim();

    if (!cleanName || !cleanUsername || !cleanPassword) {
      showMessage('error', t.fillAllWorkerFields);
      return;
    }

    if (cleanPassword.length < 6) {
      showMessage('error', t.minPassword);
      return;
    }

    setWorkerLoading(true);

    try {
      const res = await fetch('/api/create-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: cleanName,
          username: cleanUsername,
          email: usernameToEmail(cleanUsername),
          password: cleanPassword,
          adminUserId: user.id,
          role: 'worker',
          language: 'ar',
          branch: '',
        }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {}

      if (!res.ok) {
        showMessage('error', result?.error || t.workerCreateError);
        return;
      }

      setWorkerName('');
      setWorkerUsername('');
      setWorkerPassword('');
      showMessage('success', t.workerCreated);
      await fetchWorkers(profile);
    } catch {
      showMessage('error', t.workerCreateError);
    } finally {
      setWorkerLoading(false);
    }
  };

  const resetWorkerPassword = async (worker: Profile) => {
    if (profile?.role !== 'admin' || !user) return;

    const newPassword = (resetPasswordMap[worker.id] || '').trim();

    if (!newPassword) {
      showMessage('error', `${t.resetPasswordEmpty} ${worker.full_name}`);
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', t.minPassword);
      return;
    }

    setResettingWorkerId(worker.id);

    try {
      const res = await fetch('/api/reset-worker-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          newPassword,
          adminUserId: user.id,
        }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {}

      if (!res.ok) {
        showMessage('error', result?.error || t.resetPasswordError);
        return;
      }

      setResetPasswordMap((prev) => ({ ...prev, [worker.id]: '' }));
      showMessage('success', t.resetPasswordSuccess);
    } catch {
      showMessage('error', t.resetPasswordError);
    } finally {
      setResettingWorkerId(null);
    }
  };

  const saveWorkerSettings = async (worker: Profile) => {
    if (profile?.role !== 'admin' || !user) return;

    setSavingWorkerId(worker.id);

    try {
      const res = await fetch('/api/update-worker-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          adminUserId: user.id,
          language: workerLanguageMap[worker.id] || 'ar',
          branch: workerBranchMap[worker.id] || '',
        }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {}

      if (!res.ok) {
        showMessage('error', result?.error || t.branchLangError);
        return;
      }

      showMessage('success', t.branchLangSaved);
      await fetchWorkers(profile);
    } catch {
      showMessage('error', t.branchLangError);
    } finally {
      setSavingWorkerId(null);
    }
  };

  const changeWorkerRole = async (worker: Profile) => {
    if (profile?.role !== 'admin' || !user) return;
    if (!confirm(t.confirmRoleChange)) return;

    setChangingRoleId(worker.id);

    try {
      const res = await fetch('/api/update-worker-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          adminUserId: user.id,
          role: workerRoleMap[worker.id] || 'worker',
        }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {}

      if (!res.ok) {
        showMessage('error', result?.error || t.roleSaveError);
        return;
      }

      showMessage('success', t.roleSaved);
      await fetchWorkers(profile);
    } catch {
      showMessage('error', t.roleSaveError);
    } finally {
      setChangingRoleId(null);
    }
  };

  const deleteWorker = async (worker: Profile) => {
    if (profile?.role !== 'admin' || !user) return;
    if (!confirm(t.confirmDelete)) return;

    setDeletingWorkerId(worker.id);

    try {
      const res = await fetch('/api/delete-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          adminUserId: user.id,
        }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {}

      if (!res.ok) {
        showMessage('error', result?.error || t.userDeleteError);
        return;
      }

      showMessage('success', t.userDeleted);
      await fetchWorkers(profile);
    } catch {
      showMessage('error', t.userDeleteError);
    } finally {
      setDeletingWorkerId(null);
    }
  };

  const runWorkerAction = async (worker: Profile) => {
    const action = workerActionMap[worker.id] || '';

    if (!action) {
      showMessage('error', t.selectActionFirst);
      return;
    }

    if (action === 'reset-password') return await resetWorkerPassword(worker);
    if (action === 'change-role') return await changeWorkerRole(worker);
    if (action === 'save-settings') return await saveWorkerSettings(worker);
    if (action === 'delete-user') return await deleteWorker(worker);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
          setAuthLoading(false);
          setBootLoading(false);
          return;
        }

        setUser(currentUser);
        const currentProfile = await fetchProfileWithRetry(currentUser.id, false, false);

        if (currentProfile?.role === 'admin') {
          await fetchWorkers(currentProfile);
        } else {
          setWorkers([]);
        }

        if (currentProfile) {
          await fetchOrders(true, currentProfile);
        }
      } finally {
        setAuthLoading(false);
        setBootLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
        setWorkers([]);
        setOrders([]);
        setAuthLoading(false);
        return;
      }

      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') {
        return;
      }

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setProfileLoading(false);
        setWorkers([]);
        setOrders([]);
        setAuthLoading(false);
        return;
      }

      const useRetry = event === 'SIGNED_IN';
      const showLoader = event === 'SIGNED_IN';

      const currentProfile = await fetchProfileWithRetry(
        currentUser.id,
        useRetry,
        showLoader
      );

      if (currentProfile?.role === 'admin') {
        await fetchWorkers(currentProfile);
      } else {
        setWorkers([]);
      }

      if (currentProfile) {
        await fetchOrders(true, currentProfile);
      }

      setAuthLoading(false);
    });

    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !profile?.id) return;

    fetchOrders(true, profile);

    if (!autoRefresh) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(true, profile);
      }
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user?.id, profile?.id, profile?.branch, profile?.role, autoRefresh]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user && profile) {
        fetchOrders(true, profile);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.id, profile?.id, profile?.branch, profile?.role]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchWorkers(profile);
    }
  }, [profile]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (profile?.role === 'admin' && showClosedOrders) {
      return sortedOrders;
    }

    return sortedOrders.filter((o) => o.status !== 'closed');
  }, [sortedOrders, profile?.role, showClosedOrders]);

  const counts = useMemo(() => {
    const openOrders = sortedOrders.filter((o) => o.status !== 'closed');
    return {
      total: openOrders.length,
      new: openOrders.filter((o) => o.status === 'new').length,
      ready: openOrders.filter((o) => o.status === 'ready').length,
      closed: sortedOrders.filter((o) => o.status === 'closed').length,
    };
  }, [sortedOrders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleOrders;

    return visibleOrders.filter((o) =>
      safeText(o.receipt_number).toLowerCase().includes(q) ||
      safeText(o.customer_name).toLowerCase().includes(q) ||
      safeText(o.phone).toLowerCase().includes(q) ||
      safeText(o.branch).toLowerCase().includes(q) ||
      safeText(statusLabels[o.status] || o.status).toLowerCase().includes(q)
    );
  }, [visibleOrders, search, statusLabels]);

  const workerTabOrders = useMemo(() => {
    if (orderTab === 'new') return filteredOrders.filter((o) => o.status === 'new');
    if (orderTab === 'ready') return filteredOrders.filter((o) => o.status === 'ready');
    return filteredOrders;
  }, [filteredOrders, orderTab]);

  const ordersToRender = profile?.role === 'worker' ? workerTabOrders : filteredOrders;
  void clockTick;

  const workerTabs = [
    { key: 'all' as const, label: t.openOrders, count: counts.total },
    { key: 'new' as const, label: t.newOrders, count: counts.new },
    { key: 'ready' as const, label: t.readyOrders, count: counts.ready },
  ];

  if (bootLoading || authLoading || (profileLoading && !profile)) {
    return (
      <main
        dir={isArabic ? 'rtl' : 'ltr'}
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4"
      >
        <div className="rounded-[28px] border border-white/60 bg-white/85 px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          {profileLoading ? t.loadingProfile : t.loading}
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        dir={isArabic ? 'rtl' : 'ltr'}
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4 py-8 text-stone-800"
      >
        <div className="w-full max-w-md rounded-[32px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur sm:p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-bold text-stone-500">{t.languageOutside}</div>
            <select
              value={uiLanguage}
              onChange={(e) => setAppLanguage(e.target.value as Language)}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 shadow-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] border border-stone-200 bg-white shadow-sm">
              <img src="/logo-sahafa.png" alt="logo" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900">{t.login}</h1>
            <p className="mt-2 text-sm text-stone-500">{t.panel}</p>
          </div>

          {message && (
            <div
              className={cx(
                'mb-4 rounded-2xl px-4 py-3 text-sm font-bold',
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
              )}
            >
              {message.text}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-stone-700">{t.username}</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder={t.username}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-stone-700">{t.password}</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="******"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loginLoading ? t.loggingIn : t.loginButton}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main
        dir={isArabic ? 'rtl' : 'ltr'}
        className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-4"
      >
        <div className="w-full max-w-lg rounded-[28px] border border-rose-200 bg-white/90 px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:px-8 sm:py-10">
          <div className="text-lg font-extrabold text-rose-700">{t.noProfile}</div>
          <p className="mt-2 break-all text-sm text-stone-500">{user.email}</p>
          <button
            onClick={logout}
            className="mt-5 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-stone-800"
          >
            {t.logout}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#f6f1e7,_#f8f7f3_35%,_#efede7_100%)] px-3 py-4 text-stone-800 sm:px-4 sm:py-6 md:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {message && (
          <div
            className={cx(
              'rounded-[24px] px-4 py-3 text-sm font-bold shadow-sm sm:px-5 sm:py-4',
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
            )}
          >
            {message.text}
          </div>
        )}

        <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur sm:rounded-[32px]">
          <div className="absolute inset-0 bg-gradient-to-l from-stone-100/40 via-transparent to-white/20" />
          <div className="relative flex flex-col gap-5 p-4 sm:p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-stone-200 bg-white shadow-sm sm:h-20 sm:w-20 sm:rounded-[24px]">
                <img src="/logo-sahafa.png" alt="logo" className="h-11 w-11 object-contain sm:h-14 sm:w-14" />
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex rounded-full bg-stone-900 px-3 py-1 text-[11px] font-bold text-white shadow-sm sm:text-xs">
                  {profile.role === 'admin' ? t.dashboardAdmin : t.dashboardWorker}
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl">
                  {profile.role === 'admin' ? t.titleAdmin : t.titleWorker}
                </h1>
                <p className="mt-1 text-sm text-stone-500 sm:text-base">{profile.full_name || user.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                <StatCard label={t.openOrders} value={counts.total} />
                <StatCard label={t.newOrders} value={counts.new} />
                <StatCard label={t.readyOrders} value={counts.ready} />
                <StatCard label={t.deliveredOrders} value={counts.closed} />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3">
                <button
                  onClick={() => fetchOrders()}
                  disabled={refreshingOrders}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-stone-900 ring-1 ring-stone-200 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshingOrders ? t.refreshing : t.refreshOrders}
                </button>

                <button
                  onClick={logout}
                  className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-rose-600"
                >
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </section>

        {profile.role === 'admin' && (
          <section className="rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur sm:rounded-[32px] sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                onClick={() => setPageView('orders')}
                className={cx(
                  'rounded-[24px] border px-5 py-5 text-center shadow-sm transition',
                  pageView === 'orders'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                )}
              >
                <div className="text-2xl">📦</div>
                <div className="mt-2 text-base font-extrabold">{t.currentOrders}</div>
                <div className={cx('mt-1 text-sm', pageView === 'orders' ? 'text-white/80' : 'text-stone-500')}>
                  {isArabic ? `المفتوحة ${counts.total} / المغلقة ${counts.closed}` : `Open ${counts.total} / Closed ${counts.closed}`}
                </div>
              </button>

              <button
                onClick={() => setPageView('workers')}
                className={cx(
                  'rounded-[24px] border px-5 py-5 text-center shadow-sm transition',
                  pageView === 'workers'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                )}
              >
                <div className="text-2xl">👷‍♂️</div>
                <div className="mt-2 text-base font-extrabold">{t.currentWorkers}</div>
                <div className={cx('mt-1 text-sm', pageView === 'workers' ? 'text-white/80' : 'text-stone-500')}>
                  {isArabic ? `${workers.length} مستخدم` : `${workers.length} users`}
                </div>
              </button>

              <button
                onClick={() => setPageView('create-worker')}
                className={cx(
                  'rounded-[24px] border px-5 py-5 text-center shadow-sm transition',
                  pageView === 'create-worker'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
                )}
              >
                <div className="text-2xl">➕</div>
                <div className="mt-2 text-base font-extrabold">{t.addWorker}</div>
                <div className={cx('mt-1 text-sm', pageView === 'create-worker' ? 'text-white/80' : 'text-stone-500')}>
                  {isArabic ? 'إنشاء يوزر جديد' : 'Create a new user'}
                </div>
              </button>
            </div>
          </section>
        )}

        {profile.role === 'admin' && (pageView === 'create-worker' || pageView === 'workers') && (
          <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur sm:rounded-[32px]">
            {pageView === 'create-worker' && (
              <>
                <div className="border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
                  <h2 className="text-lg font-extrabold text-stone-900 sm:text-xl">{t.addWorker}</h2>
                  <p className="mt-1 text-sm text-stone-500">{t.addWorkerDesc}</p>
                </div>

                <div className="grid gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-6 md:grid-cols-2 xl:grid-cols-4 md:px-8">
              <input
                type="text"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder={t.workerName}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />

              <input
                type="text"
                value={workerUsername}
                onChange={(e) => setWorkerUsername(e.target.value)}
                placeholder={t.username}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />

              <input
                type="password"
                value={workerPassword}
                onChange={(e) => setWorkerPassword(e.target.value)}
                placeholder={t.password}
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />

              <button
                onClick={createWorker}
                disabled={workerLoading}
                className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {workerLoading ? t.addingWorker : t.addWorkerBtn}
              </button>
                </div>
              </>
            )}

            {pageView === 'workers' && (
              <>
                <div className="border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
                  <h3 className="text-lg font-extrabold text-stone-900">{t.currentWorkers}</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    {isArabic ? 'هنا تقدر تطلع على جميع المستخدمين وتعدل صلاحياتهم وبياناتهم.' : 'Manage all users, roles, and settings from here.'}
                  </p>
                </div>

                <div className="grid gap-3 px-4 pb-4 pt-4 sm:px-6 sm:pb-6 md:hidden">
              {workers.length === 0 && (
                <div className="rounded-3xl bg-stone-50 px-4 py-8 text-center text-stone-500">
                  {t.noWorkers}
                </div>
              )}

              {workers.map((w) => {
                const isExecuting =
                  resettingWorkerId === w.id ||
                  changingRoleId === w.id ||
                  savingWorkerId === w.id ||
                  deletingWorkerId === w.id;

                return (
                  <div key={w.id} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                      <div className="text-lg font-extrabold text-stone-900">{w.full_name || '-'}</div>
                      <div className="mt-1 text-sm text-stone-600">{w.username || w.email}</div>
                      <div className="text-xs text-stone-400 break-all">{w.email}</div>
                    </div>

                    <div className="grid gap-3">
                      <div>
                        <label className="mb-2 block text-xs font-bold text-stone-500">{t.role}</label>
                        <select
                          value={workerRoleMap[w.id] || w.role}
                          onChange={(e) =>
                            setWorkerRoleMap((prev) => ({
                              ...prev,
                              [w.id]: e.target.value as Role,
                            }))
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                        >
                          <option value="worker">{t.worker}</option>
                          <option value="admin">{t.admin}</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-stone-500">{t.language}</label>
                        <select
                          value={workerLanguageMap[w.id] || (w.language === 'en' ? 'en' : 'ar')}
                          onChange={(e) =>
                            setWorkerLanguageMap((prev) => ({
                              ...prev,
                              [w.id]: e.target.value as Language,
                            }))
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                        >
                          <option value="ar">{t.arabic}</option>
                          <option value="en">{t.english}</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-stone-500">{t.branch}</label>
                        <select
                          value={workerBranchMap[w.id] ?? w.branch ?? ''}
                          onChange={(e) =>
                            setWorkerBranchMap((prev) => ({
                              ...prev,
                              [w.id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                        >
                          <option value="">{t.allBranches}</option>
                          <option value="فرع الصحافة">{t.safaBranch}</option>
                          <option value="فرع الروضة">{t.rawdaBranch}</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-stone-500">{t.newPassword}</label>
                        <input
                          type="password"
                          value={resetPasswordMap[w.id] || ''}
                          onChange={(e) =>
                            setResetPasswordMap((prev) => ({
                              ...prev,
                              [w.id]: e.target.value,
                            }))
                          }
                          placeholder={t.newPassword}
                          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-stone-500">{t.actions}</label>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <select
                            value={workerActionMap[w.id] || ''}
                            onChange={(e) =>
                              setWorkerActionMap((prev) => ({
                                ...prev,
                                [w.id]: e.target.value as WorkerAction,
                              }))
                            }
                            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
                          >
                            <option value="">{t.selectAction}</option>
                            <option value="reset-password">{t.resetPasswordAction}</option>
                            <option value="change-role">{t.changeRoleAction}</option>
                            <option value="save-settings">{t.saveSettingsAction}</option>
                            <option value="delete-user">{t.deleteUserAction}</option>
                          </select>

                          <button
                            onClick={() => runWorkerAction(w)}
                            disabled={isExecuting}
                            className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm disabled:opacity-60"
                          >
                            {isExecuting ? t.executing : t.execute}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className={cx("min-w-full", isArabic ? "text-right" : "text-left")}>
                <thead className="bg-stone-50/90 text-sm text-stone-600">
                  <tr>
                    <th className="px-6 py-4 font-bold md:px-8">{t.name}</th>
                    <th className="px-6 py-4 font-bold">{t.userName}</th>
                    <th className="px-6 py-4 font-bold">{t.role}</th>
                    <th className="px-6 py-4 font-bold">{t.language}</th>
                    <th className="px-6 py-4 font-bold">{t.branch}</th>
                    <th className="px-6 py-4 font-bold">{t.newPassword}</th>
                    <th className="px-6 py-4 font-bold md:px-8">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm md:text-[15px]">
                  {workers.map((w) => {
                    const isExecuting =
                      resettingWorkerId === w.id ||
                      changingRoleId === w.id ||
                      savingWorkerId === w.id ||
                      deletingWorkerId === w.id;

                    return (
                      <tr key={w.id} className="transition hover:bg-stone-50/70">
                        <td className="px-6 py-4 font-bold md:px-8">{w.full_name || '-'}</td>
                        <td className="px-6 py-4 text-stone-600">
                          <div>{w.username || w.email}</div>
                          <div className="text-xs text-stone-400">{w.email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={workerRoleMap[w.id] || w.role}
                            onChange={(e) =>
                              setWorkerRoleMap((prev) => ({
                                ...prev,
                                [w.id]: e.target.value as Role,
                              }))
                            }
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm"
                          >
                            <option value="worker">{t.worker}</option>
                            <option value="admin">{t.admin}</option>
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={workerLanguageMap[w.id] || (w.language === 'en' ? 'en' : 'ar')}
                            onChange={(e) =>
                              setWorkerLanguageMap((prev) => ({
                                ...prev,
                                [w.id]: e.target.value as Language,
                              }))
                            }
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm"
                          >
                            <option value="ar">{t.arabic}</option>
                            <option value="en">{t.english}</option>
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={workerBranchMap[w.id] ?? w.branch ?? ''}
                            onChange={(e) =>
                              setWorkerBranchMap((prev) => ({
                                ...prev,
                                [w.id]: e.target.value,
                              }))
                            }
                            className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm min-w-[170px]"
                          >
                            <option value="">{t.allBranches}</option>
                            <option value="فرع الصحافة">{t.safaBranch}</option>
                            <option value="فرع الروضة">{t.rawdaBranch}</option>
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="password"
                            value={resetPasswordMap[w.id] || ''}
                            onChange={(e) =>
                              setResetPasswordMap((prev) => ({
                                ...prev,
                                [w.id]: e.target.value,
                              }))
                            }
                            placeholder={t.newPassword}
                            className="min-w-[180px] rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                          />
                        </td>

                        <td className="px-6 py-4 md:px-8">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={workerActionMap[w.id] || ''}
                              onChange={(e) =>
                                setWorkerActionMap((prev) => ({
                                  ...prev,
                                  [w.id]: e.target.value as WorkerAction,
                                }))
                              }
                              className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm min-w-[190px]"
                            >
                              <option value="">{t.selectAction}</option>
                              <option value="reset-password">{t.resetPasswordAction}</option>
                              <option value="change-role">{t.changeRoleAction}</option>
                              <option value="save-settings">{t.saveSettingsAction}</option>
                              <option value="delete-user">{t.deleteUserAction}</option>
                            </select>

                            <button
                              onClick={() => runWorkerAction(w)}
                              disabled={isExecuting}
                              className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isExecuting ? t.executing : t.execute}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {workers.length === 0 && (
                <div className="px-6 py-10 text-center text-stone-500">{t.noWorkers}</div>
              )}
            </div>
              </>
            )}
          </section>
        )}

        {((profile.role === 'worker') || (profile.role === 'admin' && pageView === 'orders')) && (
          <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur sm:rounded-[32px]">
          <div className="border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 sm:text-xl">{t.currentOrders}</h2>
                <p className="mt-1 text-sm text-stone-500">{t.currentOrdersDesc}</p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-[540px]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                />

                {profile.role === 'worker' && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="grid grid-cols-3 gap-2">
                      {workerTabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setOrderTab(tab.key)}
                          className={cx(
                            'rounded-2xl px-3 py-2 text-sm font-extrabold shadow-sm transition',
                            orderTab === tab.key
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          )}
                        >
                          <span>{tab.label}</span>
                          <span className="ms-2 inline-flex min-w-6 justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs">
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setAutoRefresh((prev) => !prev)}
                      className={cx(
                        'rounded-2xl px-4 py-2 text-sm font-bold shadow-sm transition',
                        autoRefresh
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                          : 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
                      )}
                    >
                      {isArabic ? `التحديث التلقائي: ${autoRefresh ? 'شغال' : 'موقف'}` : `Auto refresh: ${autoRefresh ? 'On' : 'Off'}`}
                    </button>
                  </div>
                )}


                {profile.role === 'admin' && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowClosedOrders((prev) => !prev)}
                      className={cx(
                        'rounded-2xl px-4 py-2 text-sm font-bold shadow-sm transition',
                        showClosedOrders
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
                      )}
                    >
                      {showClosedOrders ? t.hideClosedOrders : t.showClosedOrders}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-4 sm:px-6 md:hidden">
            {ordersToRender.map((o) => (
              <div
                key={o.id}
                className={cx(
                  'rounded-3xl border bg-white p-4 shadow-sm',
                  o.status === 'new' ? 'border-amber-200 ring-2 ring-amber-100' : 'border-stone-200'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-stone-500">{t.invoice}</div>
                    <div className="text-lg font-extrabold text-stone-900">#{o.receipt_number}</div>
                    <div className="mt-1 text-xs font-bold text-stone-500">
                      {formatOrderAge(o.created_at, currentLang)} • {formatOrderTime(o.created_at, currentLang)}
                    </div>
                  </div>
                  <span
                    className={cx(
                      'inline-flex rounded-full px-3 py-1 text-xs font-bold',
                      statusStyles[o.status] || 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
                    )}
                  >
                    {statusLabels[o.status] || o.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoItem label={t.customer} value={o.customer_name || '-'} />
                  <InfoItem label={t.phone} value={o.phone || '-'} dir="ltr" />
                  <InfoItem label={t.branch} value={o.branch || '-'} />
                  <InfoItem
                    label={isArabic ? 'وقت الطلب' : 'Order time'}
                    value={`${formatOrderAge(o.created_at, currentLang)}`}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {o.status === 'closed' && profile.role === 'admin' ? (
                    <button
                      onClick={() => updateStatus(o.id, 'ready')}
                      disabled={busyId === o.id}
                      className="col-span-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyId === o.id ? t.updating : t.restoreReady}
                    </button>
                  ) : (
                    <>
                      {o.status !== 'closed' && (
                        <button
                          onClick={() => updateStatus(o.id, 'ready')}
                          disabled={busyId === o.id || o.status === 'ready'}
                          className={cx(
                            'rounded-2xl px-4 py-3 text-base font-extrabold text-white shadow-sm transition',
                            o.status === 'ready'
                              ? 'cursor-not-allowed bg-stone-400'
                              : 'bg-sky-600 hover:bg-sky-700'
                          )}
                        >
                          {busyId === o.id && o.status !== 'ready'
                            ? t.updating
                            : o.status === 'ready'
                            ? `${t.ready} ✔️`
                            : t.ready}
                        </button>
                      )}

                      <button
                        onClick={() => updateStatus(o.id, 'closed')}
                        disabled={busyId === o.id || o.status !== 'ready'}
                        className={cx(
                          'rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-sm transition',
                          o.status === 'closed'
                            ? 'cursor-not-allowed bg-stone-400'
                            : o.status !== 'ready'
                            ? 'cursor-not-allowed bg-stone-300'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        )}
                      >
                        {busyId === o.id && o.status === 'ready'
                          ? t.updating
                          : o.status === 'closed'
                          ? `${t.delivered} ✔️`
                          : t.delivered}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {ordersToRender.length === 0 && orders.length > 0 && (
              <div className="rounded-3xl bg-stone-50 px-4 py-8 text-center text-stone-500">
                {t.noMatchingOrders}
              </div>
            )}

            {orders.length === 0 && (
              <div className="rounded-3xl bg-stone-50 px-4 py-8 text-center text-stone-500">
                {t.noOrders}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className={cx("min-w-full", isArabic ? "text-right" : "text-left")}>
              <thead className="bg-stone-50/90 text-sm text-stone-600">
                <tr>
                  <th className="px-6 py-4 font-bold md:px-8">{t.invoice}</th>
                  <th className="px-6 py-4 font-bold">{t.customer}</th>
                  <th className="px-6 py-4 font-bold">{t.phone}</th>
                  <th className="px-6 py-4 font-bold">{t.branch}</th>
                  <th className="px-6 py-4 font-bold">{t.status}</th>
                  <th className="px-6 py-4 font-bold md:px-8">{t.actions}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 text-sm md:text-[15px]">
                {ordersToRender.map((o) => (
                  <tr key={o.id} className={cx('transition hover:bg-stone-50/70', o.status === 'new' && 'bg-amber-50/40', o.status === 'closed' && 'bg-stone-100/70')}>
                    <td className="px-6 py-4 md:px-8">
                      <div className="font-extrabold text-stone-900">#{o.receipt_number}</div>
                      <div className="mt-1 text-xs font-bold text-stone-500">{formatOrderAge(o.created_at, currentLang)}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">{o.customer_name || '-'}</td>
                    <td className="px-6 py-4 text-stone-600" dir="ltr">{o.phone || '-'}</td>
                    <td className="px-6 py-4">{o.branch || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cx(
                          'inline-flex rounded-full px-3 py-1 text-xs font-bold',
                          statusStyles[o.status] || 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
                        )}
                      >
                        {statusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 md:px-8">
                      <div className="flex flex-wrap gap-2">
                        {o.status === 'closed' && profile.role === 'admin' ? (
                          <button
                            onClick={() => updateStatus(o.id, 'ready')}
                            disabled={busyId === o.id}
                            className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busyId === o.id ? t.updating : t.restoreReady}
                          </button>
                        ) : (
                          <>
                            {o.status !== 'closed' && (
                              <button
                                onClick={() => updateStatus(o.id, 'ready')}
                                disabled={busyId === o.id || o.status === 'ready'}
                                className={cx(
                                  'rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-sm transition',
                                  o.status === 'ready'
                                    ? 'cursor-not-allowed bg-stone-400'
                                    : 'bg-sky-600 hover:bg-sky-700'
                                )}
                              >
                                {busyId === o.id && o.status !== 'ready'
                                  ? t.updating
                                  : o.status === 'ready'
                                  ? `${t.ready} ✔️`
                                  : t.ready}
                              </button>
                            )}

                            <button
                              onClick={() => updateStatus(o.id, 'closed')}
                              disabled={busyId === o.id || o.status !== 'ready'}
                              className={cx(
                                'rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-sm transition',
                                o.status === 'closed'
                                  ? 'cursor-not-allowed bg-stone-400'
                                  : o.status !== 'ready'
                                  ? 'cursor-not-allowed bg-stone-300'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              )}
                            >
                              {busyId === o.id && o.status === 'ready'
                                ? t.updating
                                : o.status === 'closed'
                                ? `${t.delivered} ✔️`
                                : t.delivered}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ordersToRender.length === 0 && orders.length > 0 && (
              <div className="px-6 py-10 text-center text-stone-500">{t.noMatchingOrders}</div>
            )}

            {orders.length === 0 && (
              <div className="px-6 py-10 text-center text-stone-500">{t.noOrders}</div>
            )}
          </div>
        </section>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-stone-200/70 bg-white/90 px-3 py-3 shadow-[0_10px_25px_rgba(0,0,0,0.04)] sm:rounded-[22px] sm:px-4 sm:py-4">
      <div className="text-[11px] font-bold text-stone-500 sm:text-xs">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-stone-900 sm:mt-2 sm:text-3xl">{value}</div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  dir,
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="rounded-2xl bg-stone-50 px-3 py-2">
      <div className="text-[11px] font-bold text-stone-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-stone-900" dir={dir}>
        {value}
      </div>
    </div>
  );
}