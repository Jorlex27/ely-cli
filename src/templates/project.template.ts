export const generateIndexTs = (name: string) => `
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { setupRoutes } from './routes'
import { db } from '@shared/utils/db.util'

const bootstrap = async () => {
    try {
        // Initialize database connection
        await db.connect()
        console.log('📦 Database connected successfully')

        // Setup application
        const app = new Elysia()
            .use(cors())
            .use(swagger({
                documentation: {
                    info: {
                        title: '${name} API',
                        version: '1.0.0'
                    }
                }
            }))

        // Setup routes
        setupRoutes(app)

        // Start server
        const port = process.env.PORT || 3000
        app.listen(port, () => {
            console.log(\`🦊 Server is running at \${app.server?.hostname}:\${app.server?.port}\`)
            console.log(\`📚 Swagger documentation at http://localhost:\${port}/swagger\`)
        })

        // Handle shutdown
        const shutdown = async () => {
            console.log('🛑 Shutting down server...')
            await db.disconnect()
            process.exit(0)
        }

        process.on('SIGINT', shutdown)
        process.on('SIGTERM', shutdown)
    } catch (error) {
        console.error('❌ Failed to start server:', error)
        await db.disconnect()
        process.exit(1)
    }
}

bootstrap()`

export const generateRouteManagerTemplate = () => `import { Elysia } from 'elysia'

// Auto-generated route imports

export const setupRoutes = (app: Elysia) => {
  // Auto-generated route registrations
  
  return app
}
`