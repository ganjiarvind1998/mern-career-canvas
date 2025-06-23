// postcss.config.cjs
module.exports = {
  plugins: [
    require('postcss-nesting'),
    require('tailwindcss'),
    require('autoprefixer'),
  ]
}
