<script setup>
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

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
          <RouterLink to="/" class="flex items-end gap-1.5 mb-4">
            <span class="text-accent text-5xl leading-none font-display font-bold tracking-tight">EDI</span>
            <span class="text-white font-normal text-2xl leading-none font-display mb-0.5">Predictions</span>
          </RouterLink>
          <p class="text-sm text-muted max-w-sm leading-relaxed">
            {{ t('app.tagline') }}. AI-powered insights across 18+ leagues.
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
              <RouterLink to="/markets" class="text-sm text-muted hover:text-accent transition-colors">
                {{ t('nav.markets') }}
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
