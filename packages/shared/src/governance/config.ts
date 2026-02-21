import {
  ComponentAddress,
  FungibleResourceAddress,
  PackageAddress
} from '@radix-effects/shared'
import { Context, Effect, Layer, Config as ConfigEffect, Data } from 'effect'

export class UnsupportedNetworkIdError extends Data.TaggedError(
  '@GovernenceConfig/UnsupportedNetworkIdError'
)<{
  message: string
}> {}

export class GovernanceConfig extends Context.Tag('@Governance/Config')<
  GovernanceConfig,
  {
    readonly packageAddress: PackageAddress
    readonly componentAddress: ComponentAddress
    readonly adminBadgeAddress: FungibleResourceAddress
    readonly xrdResourceAddress: FungibleResourceAddress
  }
>() {
  static StokenetLive = Layer.succeed(this, {
    packageAddress: PackageAddress.make(
      'package_tdx_2_1p5cv7gym87c8dnsdx8rlv587mqw34v6qmska5ctxh04st0t07wq32s'
    ),
    componentAddress: ComponentAddress.make(
      'component_tdx_2_1cqnp3rptnwqjc4r7kzwkctec09jkdqa8v2rue580kw66fvt4ctpnmc'
    ),
    adminBadgeAddress: FungibleResourceAddress.make(
      'resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc'
    ),
    xrdResourceAddress: FungibleResourceAddress.make(
      'resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc'
    )
  })

  static MainnetLive = Layer.succeed(this, {
    packageAddress: PackageAddress.make('package_rdx1p5w0ckjksr2q7ww5f5u76dzmvvekmyae2t7p6k2xm9v26ysddqvsvk'),
    componentAddress: ComponentAddress.make('component_rdx1crem8ch5ymr8fwn6sm4xf29lt83w27svqkzmy0945hhdphzpk2me94'),
    adminBadgeAddress: FungibleResourceAddress.make(
      'resource_rdx1t4w7y3284p6uc45j8qnq9kp86sq6cazdqs9rgv0jue6zp2cd7ur36e'
    ),
    xrdResourceAddress: FungibleResourceAddress.make(
      'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd'
    )
  })
}

export const GovernanceConfigLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const networkId = yield* ConfigEffect.number('NETWORK_ID').pipe(
      Effect.orDie
    )

    if (networkId === 1) {
      return GovernanceConfig.MainnetLive
    } else if (networkId === 2) {
      return GovernanceConfig.StokenetLive
    } else {
      return yield* new UnsupportedNetworkIdError({
        message: `Unsupported network ID: ${networkId}`
      })
    }
  })
)
