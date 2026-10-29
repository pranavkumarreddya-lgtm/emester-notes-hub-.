const { Scanner } = require('@tailwindcss/oxide');
const { compile } = require('@tailwindcss/node');

module.exports = function tailwindPlugin() {
  return {
    postcssPlugin: 'tailwind-v4-local',
    async Once(root, { postcss }) {
      try {
        const scanner = new Scanner({
          sources: [
            {
              base: process.cwd(),
              pattern: 'src/**/*.{ts,tsx,js,jsx,html}',
              negated: false,
            },
          ],
        });
        const candidates = scanner.scan();
        const rawCss = root.toResult().css;
        const compiler = await compile(rawCss, {
          base: process.cwd(),
          onDependency: () => {},
        });
        const compiledCss = compiler.build(candidates);
        const newRoot = postcss.parse(compiledCss);
        root.removeAll();
        root.append(newRoot.nodes);
      } catch (err) {
        console.error('[tailwind-v4-local error]', err);
      }
    },
  };
};

module.exports.postcss = true;

