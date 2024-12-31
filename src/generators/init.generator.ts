import path from 'path'
import chalk from 'chalk'
import { exists, createDirectory, writeFile } from '@utils/file.util'
import { generateIndexTs, generateRouteManagerTemplate } from '@templates/project.template'
import { execSync } from 'child_process'
import fs from 'fs/promises'

export const initializeProject = async (projectName: string) => {
    const projectPath = path.join(process.cwd(), projectName)
    const isExisting = await exists(projectPath)

    if (isExisting) {
        console.log(chalk.yellow(`Project ${projectName} already exists!`))
        return
    }

    try {
        await createDirectory(projectPath)

        process.chdir(projectPath)

        console.log(chalk.blue('Initializing Bun project...'))
        execSync('bun init -y', { stdio: 'inherit' })

        const filesToRemove = ['index.ts', 'README.md', '.gitignore', 'tsconfig.json']
        for (const file of filesToRemove) {
            await fs.unlink(file).catch(() => { })
        }

        console.log(chalk.blue('Installing dependencies...'))
        execSync('bun add elysia @elysiajs/cors @elysiajs/swagger mongodb', {
            stdio: 'inherit'
        })
        execSync('bun add -d @types/mongodb', {
            stdio: 'inherit'
        })

        console.log(chalk.green('✨ Dependencies installed successfully!'))

        const dirs = [
            'src/modules',
            'src/shared/middleware',
            'src/shared/utils',
            'src/config',
        ]

        for (const dir of dirs) {
            await createDirectory(dir)
        }

        // Create database config
        const dbConfig = `interface DatabaseConfig {
    url: string;
    name: string;
    options?: {
        maxPoolSize?: number;
        minPoolSize?: number;
        retryWrites?: boolean;
        retryReads?: boolean;
    };
}

interface Config {
    development: DatabaseConfig;
    test: DatabaseConfig;
    production: DatabaseConfig;
}

export const dbConfig: Config = {
    development: {
        url: process.env.DB_URL || 'mongodb://localhost:27017',
        name: process.env.DB_NAME || 'elysia_dev',
        options: {
            maxPoolSize: 10,
            minPoolSize: 5,
            retryWrites: true,
            retryReads: true
        }
    },
    test: {
        url: process.env.TEST_DB_URL || 'mongodb://localhost:27017',
        name: process.env.TEST_DB_NAME || 'elysia_test',
        options: {
            maxPoolSize: 5,
            minPoolSize: 1
        }
    },
    production: {
        url: process.env.PROD_DB_URL || 'mongodb://localhost:27017',
        name: process.env.PROD_DB_NAME || 'elysia_prod',
        options: {
            maxPoolSize: 20,
            minPoolSize: 10,
            retryWrites: true,
            retryReads: true
        }
    }
}`

        // Create database utility
        const dbUtil = `import { MongoClient, Db } from 'mongodb'
import { dbConfig } from '@config/db.config'

class Database {
    private static instance: Database
    private client: MongoClient | null = null
    private db: Db | null = null

    private constructor() {}

    static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }

    async connect(): Promise<void> {
        try {
            const env = process.env.NODE_ENV || 'development'
            const config = dbConfig[env as keyof typeof dbConfig]

            if (!this.client) {
                this.client = new MongoClient(config.url, config.options)
                await this.client.connect()
                this.db = this.client.db(config.name)
                console.log(\`Connected to database: \${config.name}\`)
            }
        } catch (error) {
            console.error('Database connection error:', error)
            throw error
        }
    }

    getDb(): Db {
        if (!this.db) {
            throw new Error('Database not initialized. Call connect() first.')
        }
        return this.db
    }

    async disconnect(): Promise<void> {
        try {
            if (this.client) {
                await this.client.close()
                this.client = null
                this.db = null
                console.log('Database connection closed')
            }
        } catch (error) {
            console.error('Error closing database connection:', error)
            throw error
        }
    }
}

export const db = Database.getInstance()`

        // Create tsconfig.json with path aliases
        const tsConfig = {
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

        // Write all config files
        await writeFile(
            path.join(projectPath, 'src/config/db.config.ts'),
            dbConfig
        )

        await writeFile(
            path.join(projectPath, 'src/shared/utils/db.util.ts'),
            dbUtil
        )

        await writeFile(
            path.join(projectPath, 'tsconfig.json'),
            JSON.stringify(tsConfig, null, 2)
        )

        // Create .env and .env.example
        const envTemplate = `# Database Configuration
NODE_ENV=development

# Development Database
DB_URL=mongodb://localhost:27017
DB_NAME=elysia_dev

# Test Database
TEST_DB_URL=mongodb://localhost:27017
TEST_DB_NAME=elysia_test

# Production Database
PROD_DB_URL=mongodb://your-production-url:27017
PROD_DB_NAME=elysia_prod`

        await writeFile(
            path.join(projectPath, '.env.example'),
            envTemplate
        )

        await writeFile(
            path.join(projectPath, '.env'),
            envTemplate
        )

        await writeFile(
            path.join(projectPath, 'src/index.ts'),
            generateIndexTs(projectName)
        )

        await writeFile(
            path.join(projectPath, 'src/routes.ts'),
            generateRouteManagerTemplate()
        )

        await writeFile(
            path.join(projectPath, 'README.md'),
            `# ${projectName}\n\nElysia.js project generated with ely-cli\n`
        )

        await writeFile(
            path.join(projectPath, '.gitignore'),
            `node_modules/\n.env\ndist/\n.DS_Store\n/\n.env`
        )

        const packageJson = {
            name: projectName,
            version: '1.0.0',
            type: "module",
            scripts: {
                dev: 'bun run --watch src/index.ts',
                start: 'bun run src/index.ts',
                build: "bun build ./src/cli.ts --outdir ./dist --target node",
            },
            dependencies: {
                elysia: 'latest',
                '@elysiajs/cors': 'latest',
                '@elysiajs/swagger': 'latest',
                'mongodb': 'latest'
            },
            devDependencies: {
                '@types/mongodb': 'latest'
            }
        }

        await writeFile(
            path.join(projectPath, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        )

        console.log(chalk.green(`✨ Project ${projectName} initialized successfully!`))
        console.log(chalk.blue(`\nTo get started:`))
        console.log(chalk.white(`  cd ${projectName}`))
        console.log(chalk.white(`  bun run dev\n`))
    } catch (error) {
        console.error(chalk.red('Error initializing project:'), error)
        throw error
    }
}