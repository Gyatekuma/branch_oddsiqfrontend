<script setup>
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { ChartBarIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const currentYear = new Date().getFullYear()

const footerLinks = [
  { name: 'footer.links.privacy', to: '/privacy' },
  { name: 'footer.links.terms', to: '/terms' },
  { name: 'footer.links.contact', to: '/contact' }
]
</script>

<template>
  <footer class="bg-surface border-t border-border">
    <div class="container-app py-8">
      <!-- Main footer content -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <!-- Brand -->
        <div class="md:col-span-2">
          <RouterLink to="/" class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <ChartBarIcon class="w-5 h-5 text-bg" />
            </div>
            <span class="text-xl font-display font-bold text-text">
              Odds<span class="text-accent">IQ</span>
            </span>
          </RouterLink>
          <p class="text-sm text-muted max-w-sm">
            {{ t('app.tagline') }}. Expert analysis and AI-powered insights for smarter betting decisions.
          </p>
        </div>

        <!-- Quick links -->
        <div>
          <h4 class="section-header mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/predictions" class="text-sm text-muted hover:text-accent transition-colors">
                {{ t('nav.predictions') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/accuracy" class="text-sm text-muted hover:text-accent transition-colors">
                {{ t('nav.accuracy') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/guides" class="text-sm text-muted hover:text-accent transition-colors">
                {{ t('nav.guides') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/premium" class="text-sm text-muted hover:text-accent transition-colors">
                {{ t('nav.premium') }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Legal -->
        <div>
          <h4 class="section-header mb-4">Legal</h4>
          <ul class="space-y-2">
            <li v-for="link in footerLinks" :key="link.to">
              <RouterLink :to="link.to" class="text-sm text-muted hover:text-accent transition-colors">
                {{ t(link.name) }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="pt-6 border-t border-border">
        <p class="text-xs text-muted text-center mb-4">
          {{ t('footer.disclaimer') }}
        </p>
        <p class="text-xs text-muted text-center">
          {{ t('footer.copyright', { year: currentYear }) }}
        </p>
      </div>
    </div>
  </footer>
</template>
