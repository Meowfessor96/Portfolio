const stage = document.querySelector('.project-stage')
const wheel = stage.querySelector('.project-wheel')
const detail = stage.querySelector('.project-detail')
const catalog = document.querySelector('.project-catalog')
const instructions = document.querySelector('#project-instructions')
const topicInstructions = instructions.textContent
const detailDuration = 1050
let detailAnimation = null

function projectTitle(card) {
  const title = card.querySelector('h4, strong').cloneNode(true)
  title.querySelector('[aria-hidden]')?.remove()
  return title.textContent.trim()
}

const topics = [...catalog.querySelectorAll('[data-sector]')].map(panel => ({
  key: panel.dataset.sector,
  symbol: panel.dataset.symbol,
  title: panel.querySelector('h3').textContent,
  projects: [...panel.querySelectorAll('[data-wheel-title]')].map(card => ({
    card,
    title: projectTitle(card),
    label: card.dataset.wheelTitle
  }))
}))

let layer
let currentTopic = null
let activeDrag = null

function polar(angle, radius) {
  const radians = (angle - 90) * Math.PI / 180
  return [50 + Math.cos(radians) * radius, 50 + Math.sin(radians) * radius]
}

function sliceShape(index, total) {
  const center = index * 360 / total
  const half = 180 / total - 1.25
  const steps = Math.ceil(half / 3)
  const angles = Array.from({ length: steps + 1 }, (_, step) => center - half + 2 * half * step / steps)
  const edge = [...angles.map(angle => polar(angle, 49.7)), ...angles.reverse().map(angle => polar(angle, 19.6))]
  return 'polygon(' + edge.map(([x, y]) => x.toFixed(2) + '% ' + y.toFixed(2) + '%').join(',') + ')'
}

function buttonLabel(item, count) {
  const label = document.createElement('span')
  label.className = 'wheel-label'
  if (count) {
    const symbol = document.createElement('span')
    symbol.className = 'wheel-symbol'
    symbol.setAttribute('aria-hidden', 'true')
    symbol.textContent = item.symbol
    label.append(symbol)
  }
  const title = document.createElement('strong')
  title.textContent = item.label || item.title
  label.append(title)
  if (count) {
    const length = item.projects.length
    const total = document.createElement('small')
    total.textContent = length + (length === 1 ? ' project' : ' projects')
    label.append(total)
  }
  return label
}

function resizeDetail(from, to, complete = () => {}) {
  detailAnimation?.cancel()
  detailAnimation = null
  detail.style.height = to + 'px'
  if (!transitionsEnabled() || Math.abs(to - from) < 1) {
    detail.style.height = ''
    complete()
    return
  }

  const animation = detail.animate([{ height: from + 'px' }, { height: to + 'px' }], {
    duration: detailDuration,
    easing: 'cubic-bezier(.25, .72, .22, 1)'
  })
  detailAnimation = animation
  animation.onfinish = () => {
    if (detailAnimation !== animation) return
    detailAnimation = null
    detail.style.height = ''
    complete()
  }
}

document.addEventListener('portfolio-motionchange', () => {
  if (!transitionsEnabled()) detailAnimation?.finish()
})

function clearSelection() {
  if (detail.hidden) return
  const from = detail.getBoundingClientRect().height
  detail.inert = true
  stage.classList.remove('has-detail')
  resizeDetail(from, 0, () => {
    detail.hidden = true
    detail.replaceChildren()
  })
}

function showProject(item, button) {
  if (button.getAttribute('aria-pressed') === 'true') return
  const from = detail.hidden ? 0 : detail.getBoundingClientRect().height
  for (const piece of layer.querySelectorAll('.wheel-slice')) piece.setAttribute('aria-pressed', String(piece === button))
  const panel = document.createElement('article')
  panel.className = 'project-info'
  const heading = document.createElement('h3')
  heading.textContent = item.title
  panel.append(heading, item.card.querySelector('p').cloneNode(true))
  const actions = item.card.querySelector('.project-actions')
  if (actions) {
    panel.append(actions.cloneNode(true), item.card.querySelector('small').cloneNode(true))
  } else {
    const link = document.createElement('a')
    link.href = item.card.href
    link.className = 'button button-bright'
    link.target = '_blank'
    link.rel = 'noopener'
    link.textContent = 'View project ↗'
    panel.append(link)
  }
  detail.replaceChildren(panel)
  detail.hidden = false
  detail.inert = false
  const targetHeight = panel.offsetHeight
  stage.classList.add('has-detail')
  resizeDetail(from, targetHeight)
}

function dragToCenter(button, topic, hub) {
  let ignoreClick = false
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return
    ignoreClick = false
    activeDrag = { id: event.pointerId, x: event.clientX, y: event.clientY }
    button.setPointerCapture(event.pointerId)
  })

  function atHub(event) {
    const bounds = hub.getBoundingClientRect()
    return Math.hypot(event.clientX - bounds.left - bounds.width / 2, event.clientY - bounds.top - bounds.height / 2) < bounds.width * .55
  }

  button.addEventListener('pointermove', event => {
    if (activeDrag?.id !== event.pointerId) return
    if (!activeDrag.ghost) {
      if (Math.hypot(event.clientX - activeDrag.x, event.clientY - activeDrag.y) < 8) return
      activeDrag.ghost = document.createElement('span')
      activeDrag.ghost.className = 'wheel-drag-label'
      activeDrag.ghost.setAttribute('aria-hidden', 'true')
      activeDrag.ghost.textContent = topic.title
      wheel.append(activeDrag.ghost)
      button.classList.add('is-dragging')
    }
    const bounds = wheel.getBoundingClientRect()
    activeDrag.ghost.style.left = (event.clientX - bounds.left) + 'px'
    activeDrag.ghost.style.top = (event.clientY - bounds.top) + 'px'
    hub.classList.toggle('is-target', atHub(event))
  })

  function finish(event, drop) {
    if (activeDrag?.id !== event.pointerId) return
    ignoreClick = Boolean(activeDrag.ghost)
    activeDrag.ghost?.remove()
    activeDrag = null
    button.classList.remove('is-dragging')
    hub.classList.remove('is-target')
    if (drop && ignoreClick && atHub(event)) enterTopic(topic)
  }

  button.addEventListener('pointerup', event => finish(event, true))
  button.addEventListener('pointercancel', event => finish(event, false))
  button.addEventListener('lostpointercapture', event => finish(event, false))
  button.addEventListener('click', event => {
    if (!ignoreClick || event.detail === 0) enterTopic(topic)
    ignoreClick = false
  })
}

function showWheel(topic, restoreFocus = false) {
  const previous = layer
  const choices = topic ? topic.projects : topics
  instructions.textContent = topic ? topic.title + ' · Select a project to see its details.' : topicInstructions
  layer = document.createElement('div')
  layer.className = 'wheel-layer'
  layer.dataset.level = topic ? 'projects' : 'topics'
  layer.setAttribute('role', 'group')
  layer.setAttribute('aria-label', topic ? topic.title + ' projects' : 'Project topics')

  const hub = document.createElement(topic ? 'button' : 'div')
  hub.className = 'wheel-hub'
  if (topic) {
    hub.type = 'button'
    hub.textContent = '← Topics'
    hub.setAttribute('aria-label', 'Back to project topics')
    hub.addEventListener('click', backToTopics)
  } else {
    hub.textContent = 'Drag here'
    hub.setAttribute('aria-hidden', 'true')
  }

  const buttons = choices.map((item, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'wheel-slice'
    button.dataset.sector = topic?.key || item.key
    button.style.clipPath = sliceShape(index, choices.length)
    const [x, y] = polar(index * 360 / choices.length, 34.4)
    button.style.setProperty('--label-x', x + '%')
    button.style.setProperty('--label-y', y + '%')
    button.append(buttonLabel(item, !topic))
    button.setAttribute('aria-label', item.title)
    if (topic) {
      button.setAttribute('aria-pressed', 'false')
      button.setAttribute('aria-controls', 'project-detail')
      button.addEventListener('click', () => showProject(item, button))
    } else {
      dragToCenter(button, item, hub)
    }
    layer.append(button)
    return button
  })

  layer.append(hub)
  if (previous) previous.inert = true
  wheel.append(layer)
  if (topic) hub.focus({ preventScroll: true })
  else if (restoreFocus) buttons[topics.indexOf(restoreFocus)]?.focus({ preventScroll: true })
  if (!previous) return
  previous.setAttribute('aria-hidden', 'true')
  if (!transitionsEnabled()) previous.remove()
  else {
    const outgoing = previous.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.91)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' })
    outgoing.finished.then(() => previous.remove())
  }
}

function enterTopic(topic) {
  if (currentTopic) return
  currentTopic = topic
  showWheel(topic)
}

function backToTopics() {
  const previous = currentTopic
  currentTopic = null
  clearSelection()
  showWheel(null, previous)
}

wheel.addEventListener('keydown', event => {
  if (event.key === 'Escape' && currentTopic) {
    event.preventDefault()
    backToTopics()
    return
  }
  const directions = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  if (!Object.hasOwn(directions, event.key)) return
  const buttons = [...layer.querySelectorAll('.wheel-slice')]
  const index = buttons.indexOf(document.activeElement)
  const next = index < 0 ? 0 : (index + directions[event.key] + buttons.length) % buttons.length
  event.preventDefault()
  buttons[next].focus()
})

catalog.hidden = true
stage.hidden = false
showWheel(null)
