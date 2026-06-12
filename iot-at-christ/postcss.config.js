// Without this file Next.js never runs Tailwind over globals.css and the
// whole site ships unstyled (the raw @tailwind directives end up in the
// bundle). Keep it CommonJS — Next's PostCSS loader requires it.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
