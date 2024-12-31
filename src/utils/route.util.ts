import path from 'path'
import fs from 'fs/promises'
import chalk from 'chalk'

export const updateRouteManager = async (name: string) => {
    const routeManagerPath = path.join(process.cwd(), 'src/routes.ts')

    try {
        // Read existing routes file
        let content = await fs.readFile(routeManagerPath, 'utf-8')

        // Import statement to add
        const importStatement = `import { ${name.toLowerCase()}Routes } from './modules/${name.toLowerCase()}'`

        // Add import under the last import statement
        if (!content.includes(importStatement)) {
            content = content.replace(
                /(import.*\n)(?!import)/,
                `$1${importStatement}\n`
            )
        }

        // Add route registration in the setupRoutes function
        const routeToAdd = `app.use(${name.toLowerCase()}Routes)`

        if (!content.includes(routeToAdd)) {
            // Find the position right after route registrations comment
            const registrationPosition = content.indexOf('// Auto-generated route registrations')
            if (registrationPosition !== -1) {
                // Split content into before and after the insertion point
                const before = content.slice(0, registrationPosition + '// Auto-generated route registrations'.length)
                const after = content.slice(registrationPosition + '// Auto-generated route registrations'.length)

                // Combine with new route
                content = `${before}\n  ${routeToAdd}${after}`
            }
        }

        // Write updated content back to file
        await fs.writeFile(routeManagerPath, content)
        console.log(chalk.blue(`Updated routes manager with ${name} module`))
    } catch (error) {
        console.error(chalk.red('Error updating route manager:'), error)
        throw error
    }
}