import path from 'path'
import fs from 'fs/promises'
import chalk from 'chalk'

export const updateRouteManager = async (name: string, camelName: string) => {
    const routeManagerPath = path.join(process.cwd(), 'src/routes.ts')

    try {
        // Read existing routes file
        let content = await fs.readFile(routeManagerPath, 'utf-8')

        // Import statement to add
        const importStatement = `import { ${camelName}Routes } from './modules/${name.toLowerCase()}'`

        // Add import under the last import statement
        if (!content.includes(importStatement)) {
            content = content.replace(
                /(import.*\n)(?!import)/,
                `$1${importStatement}\n`
            )
        }

        // Add route registration in the setupRoutes function
        const routeToAdd = `app.use(${camelName}Routes)`

        if (!content.includes(routeToAdd)) {
            // Pattern untuk mencari posisi antara deklarasi fungsi dan return
            content = content.replace(
                /(export const setupRoutes = \(app: Elysia\) => {[\s\n]*)([\s\n]*return app)/,
                `$1  ${routeToAdd}\n$2`
            )
        }

        // Write updated content back to file
        await fs.writeFile(routeManagerPath, content)
        console.log(chalk.blue(`Updated routes manager with ${name} module`))
    } catch (error) {
        console.error(chalk.red('Error updating route manager:'), error)
        throw error
    }
}