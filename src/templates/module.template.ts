import { toProperCase } from "@/helpers/text.helpers"

export const generateControllerTemplate = (name: string): string => `
import { ${toProperCase(name)}Service } from './${name}.service'
import type { ${toProperCase(name)}Data, ${toProperCase(name)}Input } from './${name}.types'

export class ${toProperCase(name)}Controller {
    constructor(private service: ${toProperCase(name)}Service = new ${toProperCase(name)}Service()) {}

    async getAll() {
        return await this.service.findAll()
    }

    async getById(id: string) {
        return await this.service.findById(id)
    }

    async create(data: ${toProperCase(name)}Input) {
        return await this.service.create(data)
    }

    async update(id: string, data: Partial<${toProperCase(name)}Data>) {
        return await this.service.update(id, data)
    }

    async delete(id: string) {
        return await this.service.delete(id)
    }
}`

export const generateServiceTemplate = (name: string): string => `
import { COLLECTIONS } from '@/config/collections.config'
import { db } from '@/shared/utils/db.util'
import { ObjectId } from 'mongodb'
import type { ${toProperCase(name)}Data, ${toProperCase(name)}Input } from './${name}.types'

export class ${toProperCase(name)}Service {
    private get collection() {
        return db.getDb().collection(COLLECTIONS.${name.toUpperCase()})
    }

    async findAll() {
        const items = await this.collection.find().toArray()
        return items
    }

    async findById(id: string) {
        const item = await this.collection.findOne({ _id: new ObjectId(id) })
        if (!item) throw new Error('${toProperCase(name)} not found')
        return item
    }

    async create(data: ${toProperCase(name)}Input) {
        const newItem: ${toProperCase(name)}Data = {
            ...data,
            _id: new ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date()
        }
        await this.collection.insertOne(newItem)
        return newItem
    }

    async update(id: string, data: Partial<${toProperCase(name)}Data>) {
        const updatedItem = {
            ...data,
            updatedAt: new Date()
        }
        
        const result = await this.collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedItem }
        )

        if (!result.matchedCount) {
            throw new Error('${toProperCase(name)} not found')
        }

        return this.findById(id)
    }

    async delete(id: string) {
        const result = await this.collection.deleteOne({ _id: new ObjectId(id) })
        if (!result.deletedCount) {
            throw new Error('${toProperCase(name)} not found')
        }
        return { id }
    }
}`

export const generateRouteTemplate = (name: string): string => `
import { Elysia, t } from 'elysia'
import { ${toProperCase(name)}Controller } from './${name}.controller'

let controller: ${toProperCase(name)}Controller

export const ${name.toLowerCase()}Routes = new Elysia({ prefix: '/${name.toLowerCase()}' })
    .onBeforeHandle(() => {
        // Lazy initialization of controller
        if (!controller) {
            controller = new ${toProperCase(name)}Controller()
        }
    })
    .get('/', () => controller.getAll(), {
        detail: {
            tags: ['${toProperCase(name)}'],
            summary: 'Get all ${name.toLowerCase()} items'
        }
    })
    .get('/:id', ({ params: { id } }) => controller.getById(id), {
        params: t.Object({
            id: t.String()
        }),
        detail: {
            tags: ['${toProperCase(name)}'],
            summary: 'Get ${name.toLowerCase()} by ID'
        }
    })
    .post('/', ({ body }) => controller.create(body), {
        body: t.Object({
            // Add your validation schema here
        }),
        detail: {
            tags: ['${toProperCase(name)}'],
            summary: 'Create new ${name.toLowerCase()}'
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
            tags: ['${toProperCase(name)}'],
            summary: 'Update ${name.toLowerCase()} by ID'
        }
    })
    .delete('/:id', ({ params: { id } }) => controller.delete(id), {
        params: t.Object({
            id: t.String()
        }),
        detail: {
            tags: ['${toProperCase(name)}'],
            summary: 'Delete ${name.toLowerCase()} by ID'
        }
    })`