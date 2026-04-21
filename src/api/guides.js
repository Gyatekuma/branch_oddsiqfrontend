import api from './axios'

export const guidesApi = {
  async getAll() {
    const response = await api.get('/api/guides/')
    const data = response.data.data
    return { guides: data.guides || data || [] }
  },

  async getBySlug(slug) {
    const response = await api.get(`/api/guides/${slug}`)
    return { guide: response.data.data }
  },

  async getBySport(sportName) {
    const response = await api.get(`/api/guides/sport/${sportName}`)
    const data = response.data.data
    return { guides: data.guides || data || [] }
  },

  // Note: Backend doesn't have a dedicated related guides endpoint
  // We can filter by sport from the guide's sport_id
  async getRelated(slug, limit = 3) {
    // First get the guide to know its sport
    try {
      const guideResponse = await this.getBySlug(slug)
      const guide = guideResponse.guide

      if (guide && guide.sport_id) {
        // Get guides from same sport, excluding current
        const sportResponse = await api.get(`/api/guides/sport/${guide.sport}`)
        const allGuides = sportResponse.data.data.guides || sportResponse.data.data || []
        const related = allGuides.filter(g => g.slug !== slug).slice(0, limit)
        return { guides: related }
      }
    } catch (err) {
      console.error('Failed to get related guides:', err)
    }

    return { guides: [] }
  },

  // Note: Backend doesn't have categories endpoint
  // Categories would need to be derived from guides or added to backend
  async getCategories() {
    return { categories: [] }
  },

  // Admin endpoints
  async create(data) {
    const response = await api.post('/api/admin/guides', data)
    return response.data.data
  },

  async update(id, data) {
    const response = await api.put(`/api/admin/guides/${id}`, data)
    return response.data.data
  },

  async delete(id) {
    const response = await api.delete(`/api/admin/guides/${id}`)
    return response.data
  }
}

export default guidesApi
