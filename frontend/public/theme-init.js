// Aplica el tema guardado antes de pintar (evita el parpadeo claro → oscuro).
// Archivo propio y no <script> inline: la CSP de producción solo permite scripts de 'self'.
;(function () {
  try {
    var saved = localStorage.getItem('estacioncafe-theme')
    var theme = saved === 'light' || saved === 'dark' ? saved : 'system'
    var dark =
      theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  } catch {
    /* sin localStorage: queda el tema claro */
  }
})()
