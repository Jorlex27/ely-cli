export const tsConfig = {
    compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        types: ["bun-types"],
        allowImportingTsExtensions: true,
        moduleDetection: "force",
        allowJs: true,
        strict: true,
        noUncheckedIndexedAccess: true,
        noEmit: true,
        composite: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
        rootDir: ".",
        baseUrl: "src",
        paths: {
            "@/*": ["*"],
            "@modules/*": ["modules/*"],
            "@shared/*": ["shared/*"],
            "@config/*": ["config/*"],
            "@templates/*": ["templates/*"],
            "@utils/*": ["utils/*"]
        }
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
}