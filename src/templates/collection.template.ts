import path from "path"
import fs from "fs/promises"
import chalk from "chalk"

export const generateCollectionTemplate = (collections: string[]): string => {
    const collectionsObject = collections
        .map(name => `    ${name.toUpperCase()}: '${name.toLowerCase()}'`)
        .join(',\n')

    return `// This file is auto-generated. Do not edit manually
export const COLLECTIONS = {
${collectionsObject}
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]
`
}

// Utility function to update collections
export const updateCollectionsConfig = async (newModule: string) => {
    const configPath = path.join(process.cwd(), 'src/config/collections.config.ts')
    
    try {
        // Read existing collections or create new if doesn't exist
        let existingCollections: string[] = []
        try {
            const content = await fs.readFile(configPath, 'utf-8')
            const matches = content.match(/['"]([^'"]+)['"]/g)
            if (matches) {
                existingCollections = matches
                    .map(m => m.replace(/['"]/g, ''))
                    .filter(m => m !== 'collections.config.ts')
            }
        } catch {
            // File doesn't exist yet, that's okay
        }

        // Add new module if it doesn't exist
        if (!existingCollections.includes(newModule.toLowerCase())) {
            existingCollections.push(newModule.toLowerCase())
        }

        // Generate new content
        const content = generateCollectionTemplate(existingCollections)

        // Ensure config directory exists
        await fs.mkdir(path.dirname(configPath), { recursive: true })

        // Write updated collections
        await fs.writeFile(configPath, content)
    } catch (error) {
        console.error(chalk.red('Error updating collections config:'), error)
        throw error
    }
}