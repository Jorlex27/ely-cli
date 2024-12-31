import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import {
    generateControllerTemplate,
    generateRouteTemplate,
    generateServiceTemplate
} from '../templates/module.template'
import { updateRouteManager } from '../utils/route.util'
import { generateTypesTemplate } from '@/templates/types.template'
import { updateCollectionsConfig } from '../templates/collection.template'

interface ModuleFile {
    filename: string;
    content: string;
}

export const generateModule = async (name: string) => {
    try {
        const moduleDir = path.join(process.cwd(), 'src/modules', name.toLowerCase())

        // Check if module already exists
        const exists = await fs.access(moduleDir).then(() => true).catch(() => false)
        if (exists) {
            console.log(chalk.yellow(`Module ${name} already exists!`))
            return
        }

        // Update collections first
        console.log(chalk.blue('Updating collections configuration...'))
        await updateCollectionsConfig(name)

        // Create module directory
        await fs.mkdir(moduleDir, { recursive: true })

        // Generate files with explicit typing
        const files: ModuleFile[] = [
            {
                filename: `${name}.types.ts`,
                content: generateTypesTemplate(name)
            },
            {
                filename: `${name}.controller.ts`,
                content: generateControllerTemplate(name)
            },
            {
                filename: `${name}.service.ts`,
                content: generateServiceTemplate(name)
            },
            {
                filename: `${name}.routes.ts`,
                content: generateRouteTemplate(name)
            },
            {
                filename: 'index.ts',
                content: `export * from './${name}.routes'`
            }
        ]

        // Create all files
        for (const file of files) {
            await fs.writeFile(
                path.join(moduleDir, file.filename),
                file.content
            )
        }

        await updateRouteManager(name)

        console.log(chalk.green(`✨ Module ${name} generated successfully!`))
    } catch (error) {
        console.error(chalk.red('Error generating module:'), error)
        throw error
    }
}