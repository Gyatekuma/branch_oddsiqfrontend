import api from './axios'

export const paymentsApi = {
  async getPlans() {
    const response = await api.get('/api/payments/plans')
    const data = response.data.data

    // Transform to expected format
    const plans = []
    if (data.plans) {
      plans.push(...data.plans)
    } else {
      // Default plans based on backend config
      plans.push(
        { type: 'monthly', price: data.monthly || 50, name: 'Monthly' },
        { type: 'annual', price: data.annual || 500, name: 'Annual' }
      )
    }

    return { plans }
  },

  async initiate(plan) {
    const response = await api.post('/api/payments/initiate', { plan })
    const data = response.data.data

    return {
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference: data.reference,
      plan: data.plan,
      amount: data.amount
    }
  },

  async verify(reference) {
    const response = await api.get(`/api/payments/verify/${reference}`)
    const data = response.data.data

    return {
      status: 'success',
      subscription: data.subscription,
      subscription_expires_at: data.user?.subscription_expires_at || data.subscription?.ends_at,
      user: data.user
    }
  },

  async getHistory() {
    const response = await api.get('/api/payments/history')
    const data = response.data.data
    return { payments: data.payments || [] }
  },

  async cancelSubscription() {
    const response = await api.post('/api/payments/cancel')
    return response.data
  }
}

export default paymentsApi
