import path from "path"
import fs from "fs/promises"
import chalk from "chalk"

const pluralize = (name: string): string => {
    // Handle common irregular plurals
    const irregulars: Record<string, string> = {
        person: 'people',
        child: 'children',
        foot: 'feet',
        tooth: 'teeth',
        mouse: 'mice',
        criterion: 'criteria',
        analysis: 'analyses',
        datum: 'data',
        index: 'indices',
        matrix: 'matrices',
        vertex: 'vertices',
        status: 'statuses'  // Exception to es rule
    }

    const name_lower = name.toLowerCase()
    
    // Check for irregular plurals first
    if (irregulars[name_lower]) {
        return irregulars[name_lower]
    }

    // Handle words that are already plural
    if (name_lower.endsWith('s') && 
        (name_lower.endsWith('ss') || 
         name_lower.endsWith('us') || 
         name_lower.endsWith('is'))) {
        return name
    }

    // Handle regular plural rules
    if (name_lower.endsWith('y')) {
        const vowels = new Set(['a', 'e', 'i', 'o', 'u'])
        const beforeY = name_lower[name_lower.length - 2]
        return vowels.has(beforeY as string) ? `${name}s` : `${name.slice(0, -1)}ies`
    }
    
    if (name_lower.endsWith('s') || 
        name_lower.endsWith('sh') || 
        name_lower.endsWith('ch') || 
        name_lower.endsWith('x') || 
        name_lower.endsWith('z')) {
        return `${name}es`
    }
    
    if (name_lower.endsWith('fe')) {
        return `${name.slice(0, -2)}ves`
    }
    
    if (name_lower.endsWith('f')) {
        return `${name.slice(0, -1)}ves`
    }

    // Special cases for 'o' endings
    const oExceptions = new Set(['photo', 'piano', 'memo'])
    if (name_lower.endsWith('o') && !oExceptions.has(name_lower)) {
        return `${name}es`
    }

    // Default case: just add 's'
    return `${name}s`
}

export const generateCollectionTemplate = (collections: string[]): string => {
    // Sort collections alphabetically
    const sortedCollections = [...new Set(collections)].sort()
    
    const collectionsObject = sortedCollections
        .map(name => `    ${name.toUpperCase()}: '${pluralize(name.toLowerCase())}'`)
        .join(',\n')

    return `// This file is auto-generated. Do not edit manually
// Generated on: ${new Date().toISOString()}

export const COLLECTIONS = {
${collectionsObject}
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]

// Collection names mapping
export const collectionNames = Object.values(COLLECTIONS)
`
}

export const updateCollectionsConfig = async (newModule: string) => {
    const configPath = path.join(process.cwd(), 'src/config/collections.config.ts')
    
    try {
        let existingCollections: string[] = []
        try {
            const content = await fs.readFile(configPath, 'utf-8')
            const matches = content.match(/['"]([^'"]+)['"]/g)
            if (matches) {
                existingCollections = matches
                    .map(m => m.replace(/['"]/g, ''))
                    .filter(m => m !== 'collections.config.ts')
                    .map(m => m.replace(/s$/, '')) // Remove trailing 's' to get singular form
                    .map(m => m.toLowerCase()) // Normalize to lowercase
            }
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error
            }
        }

        // Add new module if it doesn't exist
        if (!existingCollections.includes(newModule.toLowerCase())) {
            existingCollections.push(newModule.toLowerCase())
        }

        const content = generateCollectionTemplate(existingCollections)
        await fs.mkdir(path.dirname(configPath), { recursive: true })
        await fs.writeFile(configPath, content)
        
        console.log(chalk.blue(`Updated collections config with ${chalk.bold(newModule)} module`))
    } catch (error) {
        console.error(chalk.red('Error updating collections config:'), error)
        throw error
    }
}