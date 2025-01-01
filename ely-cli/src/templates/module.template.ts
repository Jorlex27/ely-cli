export const generateTypesTemplate = (name: string): string => `
import { ObjectId } from 'mongodb'

export interface ${name}Data {
    _id: ObjectId
    // Add your data properties here
    createdAt: Date
    updatedAt: Date
}
    
export type ${name}Input = Omit<${name}Data, '_id' | 'createdAt' | 'updatedAt'>
`

export const generateControllerTemplate = (name: string, kebabName: string): string => `
import { ${name}Service } from './${kebabName}.service'
import type { ${name}Data, ${name}Input } from './${kebabName}.types'

export class ${name}Controller {
    constructor(private service: ${name}Service = new ${name}Service()) {}

    async getAll() {
        return await this.service.findAll()
    }

    async getById(id: string) {
        return await this.service.findById(id)
    }

    async create(data: ${name}Input) {
        return await this.service.create(data)
    }

    async update(id: string, data: Partial<${name}Data>) {
        return await this.service.update(id, data)
    }

    async delete(id: string) {
        return await this.service.delete(id)
    }
}`

export const generateServiceTemplate = (name: string, kebabName: string, upperName: string): string => `
import { COLLECTIONS } from '@/config/collections.config'
import { db } from '@/shared/utils/db.util'
import { ObjectId } from 'mongodb'
import type { ${name}Data, ${name}Input } from './${kebabName}.types'

export class ${name}Service {
    private get collection() {
        return db.getDb().collection(COLLECTIONS.${upperName})
    }

    async findAll() {
        const items = await this.collection.find().toArray()
        return items
    }

    async findById(id: string) {
        const item = await this.collection.findOne({ _id: new ObjectId(id) })
        if (!item) throw new Error('${name} not found')
        return item
    }

    async create(data: ${name}Input) {
        const newItem: ${name}Data = {
            ...data,
            _id: new ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date()
        }
        await this.collection.insertOne(newItem)
        return newItem
    }

    async update(id: string, data: Partial<${name}Data>) {
        const updatedItem = {
            ...data,
            updatedAt: new Date()
        }
        
        const result = await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedItem }
        )

        if (!result.matchedCount) {
            throw new Error('${name} not found')
        }

        return this.findById(id)
    }

    async delete(id: string) {
        const result = await this.collection.deleteOne({ _id: new ObjectId(id) })
        if (!result.deletedCount) {
            throw new Error('${name} not found')
        }
        return { id }
    }
}`

export const generateRouteTemplate = (pascalName: string, kebabName: string, camelName: string): string => `
import { Elysia, t } from 'elysia'
import { ${pascalName}Controller } from './${kebabName}.controller'

let controller: ${pascalName}Controller

export const ${camelName}Routes = new Elysia({ prefix: '/${kebabName}' })
    .onBeforeHandle(() => {
        // Lazy initialization of controller
        if (!controller) {
            controller = new ${pascalName}Controller()
        }
    })
    .get('/', () => controller.getAll(), {
        detail: {
            tags: ['${pascalName}'],
            summary: 'Get all ${pascalName.toLowerCase()} items'
        }
    })
    .get('/:id', ({ params: { id } }) => controller.getById(id), {
        params: t.Object({
            id: t.String()
        }),
        detail: {
            tags: ['${pascalName}'],
            summary: 'Get ${pascalName.toLowerCase()} by ID'
        }
    })
    .post('/', ({ body }) => controller.create(body), {
        body: t.Object({
            // Add your validation schema here
        }),
        detail: {
            tags: ['${pascalName}'],
            summary: 'Create new ${pascalName.toLowerCase()}'
        }
    })
    .put('/:id', ({ params: { id }, body }) => controller.update(id, body), {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            // Add your validation schema here
        }),
        detail: {
            tags: ['${pascalName}'],
            summary: 'Update ${pascalName.toLowerCase()} by ID'
        }
    })
    .delete('/:id', ({ params: { id } }) => controller.delete(id), {
        params: t.Object({
            id: t.String()
        }),
        detail: {
            tags: ['${pascalName}'],
            summary: 'Delete ${pascalName.toLowerCase()} by ID'
        }
    })`