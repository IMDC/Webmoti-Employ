import mantine from 'eslint-config-mantine';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(...mantine, reactHooks.configs['recommended-latest'], {
  ignores: ['**/*.{mjs,cjs,js,d.ts,d.mts}'],
});
