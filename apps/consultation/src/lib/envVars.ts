import { AccountAddress } from '@radix-effects/shared'
import * as Either from 'effect/Either'
import { pipe } from 'effect/Function'
import { TreeFormatter } from 'effect/ParseResult'
import * as Schema from 'effect/Schema'

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      ENV?: string
      DAPP_DEFINITION_ADDRESS?: string
      NETWORK_ID?: string
      VOTE_COLLECTOR_URL?: string
    }
  }
}

class EnvVars extends Schema.Class<EnvVars>('EnvVars')({
  ENV: Schema.Literal('dev', 'staging', 'prod', 'local').annotations({
    decodingFallback: () => Either.right('prod' as const)
  }),
  DAPP_DEFINITION_ADDRESS: AccountAddress,
  NETWORK_ID: Schema.NumberFromString,
  VOTE_COLLECTOR_URL: Schema.String
}) {}

const isVitest =
  typeof import.meta.env !== 'undefined' &&
  typeof import.meta.env.VITEST !== 'undefined'

const vitestMockEnvVars: typeof EnvVars.Encoded = {
  ENV: 'dev',
  DAPP_DEFINITION_ADDRESS: AccountAddress.make(
    'account_rdx129xqyvgkn9h73atyrzndal004fwye3tzw49kkygv9ltm2kyrv2lmda'
  ),
  NETWORK_ID: '1',
  VOTE_COLLECTOR_URL: 'http://localhost:3001'
}

const getRawEnvVars = (): Record<keyof typeof EnvVars.Encoded, unknown> => {
  if (isVitest) return vitestMockEnvVars

  // Client-side: read from config.js (window.__RUNTIME_CONFIG__)
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) {
    return window.__RUNTIME_CONFIG__ as Record<
      keyof typeof EnvVars.Encoded,
      unknown
    >
  }

  // Server-side (SSR): fallback to process.env
  return {
    ENV: process.env.VITE_ENV as unknown,
    DAPP_DEFINITION_ADDRESS: process.env.VITE_PUBLIC_DAPP_DEFINITION_ADDRESS as unknown,
    NETWORK_ID: process.env.VITE_PUBLIC_NETWORK_ID as unknown,
    VOTE_COLLECTOR_URL: process.env.VITE_VOTE_COLLECTOR_URL as unknown
  }
}

export const envVars = pipe(
  getRawEnvVars(),
  Schema.decodeUnknownEither(EnvVars),
  Either.map((envVars) => ({
    ...envVars,
    EFFECTIVE_ENV: envVars.ENV === 'local' ? 'dev' : envVars.ENV
  })),
  Either.getOrElse((parseIssue) => {
    throw new Error(
      `❌ Invalid environment variables: ${TreeFormatter.formatErrorSync(parseIssue)}`
    )
  })
)
