const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const sections = [...document.querySelectorAll('[data-section]')]
const sectionLinks = [...document.querySelectorAll('.topbar a[href^="#"]')]
const progress = document.querySelector('.scroll-progress')
let scrollFrame = 0

function updateScroll() {
  scrollFrame = 0
  const available = document.documentElement.scrollHeight - window.innerHeight
  progress.style.setProperty('--progress', available > 0 ? Math.min(1, window.scrollY / available) : 0)
  const current = sections.findLast(section => section.getBoundingClientRect().top < window.innerHeight * .45)
  for (const link of sectionLinks) {
    if (link.hash === '#' + current?.id) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  }
}

function queueScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll)
}

let navigationFrame = 0

function cancelNavigation() {
  cancelAnimationFrame(navigationFrame)
  navigationFrame = 0
}

function animateTo(top) {
  cancelNavigation()
  const start = window.scrollY
  const distance = top - start
  if (reducedMotion.matches || Math.abs(distance) < 2) {
    window.scrollTo({ top, behavior: 'instant' })
    return
  }

  const duration = Math.min(1050, Math.max(640, 410 + Math.abs(distance) * .27))
  const started = performance.now()
  function step(now) {
    const elapsed = Math.min(1, (now - started) / duration)
    const eased = elapsed * elapsed * (3 - 2 * elapsed)
    window.scrollTo({ top: start + distance * eased, behavior: 'instant' })
    navigationFrame = elapsed < 1 ? requestAnimationFrame(step) : 0
  }
  navigationFrame = requestAnimationFrame(step)
}

addEventListener('wheel', cancelNavigation, { passive: true })
addEventListener('touchstart', cancelNavigation, { passive: true })
addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelNavigation()
})
addEventListener('popstate', cancelNavigation)

// Keep hash navigation and keyboard focus while explicitly animating in-page links.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = event.target.closest('a[href^="#"]')
  const target = sections.find(section => '#' + section.id === link?.hash)
  if (!target) return
  event.preventDefault()
  if (location.hash !== link.hash) history.pushState(null, '', link.hash)
  target.tabIndex = -1
  target.focus({ preventScroll: true })
  animateTo(target.offsetTop)
})

addEventListener('scroll', queueScrollUpdate, { passive: true })
addEventListener('resize', queueScrollUpdate)
new ResizeObserver(queueScrollUpdate).observe(document.body)
updateScroll()

const reveal = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    target.classList.toggle('is-visible', isIntersecting)
  }
}, { threshold: .13 })
document.querySelectorAll('.reveal').forEach(item => reveal.observe(item))
document.documentElement.classList.add('motion-enabled')

const canvas = document.querySelector('#signal-canvas')
const drawing = canvas.getContext('2d')
if (drawing) {
  const hero = document.querySelector('#hero')
  let visible = true
  let animation = 0
  let width = 0
  let height = 0
  let light = null

  function draw(time) {
    drawing.clearRect(0, 0, width, height)
    if (!light) return
    const phase = time * .00042
    drawing.lineWidth = 1
    drawing.strokeStyle = light
    for (let row = 0; row < 28; row++) {
      const depth = row / 27
      drawing.globalAlpha = .28 + depth * .54
      drawing.beginPath()
      for (let column = 0; column <= 110; column++) {
        const sample = column / 110
        const x = width * (.09 + sample * .87 + (depth - .5) * .12)
        const envelope = Math.sin(sample * Math.PI) ** 1.5
        const shift = depth * .92 + phase
        const wave = Math.sin(sample * 9.7 - shift * 2.3) * .58 +
          Math.sin(sample * 18.3 + shift * 2.7) * .16 +
          Math.cos(sample * 4.5 + shift) * .33
        const y = height * (.30 + depth * .43 + wave * envelope * (.40 - depth * .13))
        if (column === 0) drawing.moveTo(x, y)
        else drawing.lineTo(x, y)
      }
      drawing.stroke()
    }
    drawing.globalAlpha = 1
  }

  function tick(time) {
    draw(time)
    animation = requestAnimationFrame(tick)
  }

  function syncMotion() {
    cancelAnimationFrame(animation)
    animation = 0
    if (visible && !document.hidden && !reducedMotion.matches) animation = requestAnimationFrame(tick)
    else draw(0)
  }

  function resizeSignal() {
    const ratio = Math.min(devicePixelRatio || 1, 2)
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    drawing.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (!width || !height) {
      light = null
      return
    }
    light = drawing.createLinearGradient(width * .07, height * .8, width * .96, height * .15)
    light.addColorStop(0, '#7bb49b00')
    light.addColorStop(.24, '#b1ecc0bb')
    light.addColorStop(.55, '#ddf4a4')
    light.addColorStop(.79, '#f7bc8a')
    light.addColorStop(1, '#ea957532')
    draw(0)
  }

  new ResizeObserver(resizeSignal).observe(canvas)
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    syncMotion()
  }).observe(hero)
  reducedMotion.addEventListener('change', syncMotion)
  document.addEventListener('visibilitychange', syncMotion)
  resizeSignal()
}
