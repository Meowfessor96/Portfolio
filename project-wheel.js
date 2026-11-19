const browser = document.querySelector('.project-browser')
const wheel = browser.querySelector('.project-wheel')
const topics = [...wheel.querySelectorAll('.wheel-topic')]
const activeTitle = wheel.querySelector('.wheel-center strong')
const count = wheel.querySelector('.wheel-center small')
const panels = topics.map(button => document.getElementById(button.getAttribute('aria-controls')))

function choose(index) {
  for (const [i, topic] of topics.entries()) {
    topic.setAttribute('aria-pressed', String(i === index))
    panels[i].hidden = i !== index
  }
  const size = panels[index].querySelectorAll('.portfolio-project').length
  activeTitle.textContent = topics[index].dataset.topic
  count.textContent = size + (size === 1 ? ' project' : ' projects')
  wheel.style.setProperty('--selected-angle', (index * 90 - 44) + 'deg')
}

topics.forEach((button, index) => {
  button.addEventListener('click', () => choose(index))
  button.addEventListener('keydown', event => {
    const directions = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    if (!Object.hasOwn(directions, event.key)) return
    event.preventDefault()
    const next = (index + directions[event.key] + topics.length) % topics.length
    choose(next)
    topics[next].focus()
  })
})

choose(0)
wheel.hidden = false
browser.classList.add('is-ready')
