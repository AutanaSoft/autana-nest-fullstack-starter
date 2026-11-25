import { buildSecurityHeadersConfig } from "./security-headers.config.js"

describe("buildSecurityHeadersConfig", () => {
  it("en producción no permite cargar nada ni mostrarse en un marco", () => {
    expect(buildSecurityHeadersConfig({ NODE_ENV: "production" })).toEqual({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
    })
  })

  it("fuera de producción omite la CSP", () => {
    expect(buildSecurityHeadersConfig({ NODE_ENV: "development" })).toEqual({ contentSecurityPolicy: false })
    expect(buildSecurityHeadersConfig({})).toEqual({ contentSecurityPolicy: false })
  })
})
