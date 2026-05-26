import { ref, onMounted, onUnmounted } from 'vue'

export function usePullToRefresh(onRefresh) {
  const isPulling = ref(false)
  const isRefreshing = ref(false)
  const pullDistance = ref(0)

  const THRESHOLD = 65
  const MAX_PULL  = 90

  let startY = 0

  function onTouchStart(e) {
    if (isRefreshing.value || window.scrollY > 4) return
    startY = e.touches[0].clientY
  }

  function onTouchMove(e) {
    if (isRefreshing.value) return
    if (window.scrollY > 4) {
      startY = e.touches[0].clientY
      pullDistance.value = 0
      isPulling.value = false
      return
    }
    const dy = e.touches[0].clientY - startY
    if (dy <= 0) {
      pullDistance.value = 0
      isPulling.value = false
      return
    }
    isPulling.value = true
    pullDistance.value = Math.min(dy * 0.45, MAX_PULL)
  }

  async function onTouchEnd() {
    if (!isPulling.value) return
    if (pullDistance.value >= THRESHOLD * 0.6) {
      isRefreshing.value = true
      pullDistance.value = 52
      try {
        await onRefresh()
      } finally {
        await new Promise(r => setTimeout(r, 350))
        isRefreshing.value = false
        pullDistance.value = 0
        isPulling.value = false
      }
    } else {
      pullDistance.value = 0
      isPulling.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: true })
    document.addEventListener('touchend',   onTouchEnd,   { passive: true })
  })

  onUnmounted(() => {
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove',  onTouchMove)
    document.removeEventListener('touchend',   onTouchEnd)
  })

  return { isPulling, isRefreshing, pullDistance }
}
