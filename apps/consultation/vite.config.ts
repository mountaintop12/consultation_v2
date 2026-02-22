import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { loadEnv } from 'vite';

const
  config = defineConfig
  (
    (
      {
        mode,
        // command,
        // isPreview,
        // isSsrBuild,
      }
    ) =>
    {
      // inject environment secrets.
      process.env =
      {
        ...process.env,
        ...loadEnv(mode, process.cwd())
      };

      console.log(process.cwd())
      console.log(loadEnv(mode, process.cwd()));

      return {
        plugins:
        [
          devtools(),
          nitro(),
          // this is the plugin that enables path aliases
          viteTsConfigPaths
          (
            {
              projects: ['./tsconfig.json'],
            }
          ),
          tailwindcss(),
          tanstackStart(),
          viteReact(),
        ],
      };
    }
  )
;

export default config
