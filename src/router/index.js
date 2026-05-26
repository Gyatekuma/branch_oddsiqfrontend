import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Eager load main views
import HomeView from '@/views/HomeView.vue'
import PredictionsView from '@/views/PredictionsView.vue'
import MatchDetailView from '@/views/MatchDetailView.vue'
import LeagueHubView from '@/views/LeagueHubView.vue'
import AccuracyView from '@/views/AccuracyView.vue'
import GuidesView from '@/views/GuidesView.vue'
import GuideDetailView from '@/views/GuideDetailView.vue'
import PremiumView from '@/views/PremiumView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'

// Lazy load markets view (built next)
const MarketsView = () => import('@/views/MarketsView.vue')

// Lazy load admin views
const AdminLayout = () => import('@/views/admin/AdminLayout.vue')
const AdminPredictions = () => import('@/views/admin/AdminPredictions.vue')
const AdminUsers = () => import('@/views/admin/AdminUsers.vue')
const AdminGuides = () => import('@/views/admin/AdminGuides.vue')
const AdminStats = () => import('@/views/admin/AdminStats.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Home' }
  },
  {
    path: '/predictions',
    name: 'predictions',
    component: PredictionsView,
    meta: { title: 'Predictions' }
  },
  {
    path: '/markets',
    name: 'markets',
    component: MarketsView,
    meta: { title: 'Markets' }
  },
  {
    path: '/match/:id',
    name: 'match-detail',
    component: MatchDetailView,
    meta: { title: 'Match Details' }
  },
  {
    path: '/league/:id',
    name: 'league-hub',
    component: LeagueHubView,
    meta: { title: 'League Hub' }
  },
  {
    path: '/accuracy',
    name: 'accuracy',
    component: AccuracyView,
    meta: { title: 'Accuracy Tracker' }
  },
  {
    path: '/guides',
    name: 'guides',
    component: GuidesView,
    meta: { title: 'Betting Guides' }
  },
  {
    path: '/guides/:slug',
    name: 'guide-detail',
    component: GuideDetailView,
    meta: { title: 'Guide' }
  },
  {
    path: '/premium',
    name: 'premium',
    component: PremiumView,
    meta: { title: 'Premium' }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Login', guest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { title: 'Register', guest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: 'Dashboard', requiresAuth: true }
  },
  {
    path: '/payment/callback',
    name: 'payment-callback',
    component: () => import('@/views/PaymentCallbackView.vue'),
    meta: { title: 'Payment', requiresAuth: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/predictions'
      },
      {
        path: 'predictions',
        name: 'admin-predictions',
        component: AdminPredictions,
        meta: { title: 'Manage Predictions' }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUsers,
        meta: { title: 'Manage Users' }
      },
      {
        path: 'guides',
        name: 'admin-guides',
        component: AdminGuides,
        meta: { title: 'Manage Guides' }
      },
      {
        path: 'stats',
        name: 'admin-stats',
        component: AdminStats,
        meta: { title: 'Stats & Revenue' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Update document title
  const appName = import.meta.env.VITE_APP_NAME || 'edi predictions'
  document.title = to.meta.title ? `${to.meta.title} | ${appName}` : appName

  // Check authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Check admin role
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next({ name: 'home' })
  }

  // Redirect authenticated users away from guest pages
  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'predictions' })
  }

  next()
})

export default router
