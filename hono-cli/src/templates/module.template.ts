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

export const generateValidatorTemplate = (name: string): string => `
import { z } from "zod"

export const ${name}Schema = z.object({
    // Add your schema validation here
})
`

export const generateControllerTemplate = (name: string, kebabName: string, camelName: string): string => `
import type { Context } from "hono"
import { ${name}Service } from './${kebabName}.service'
import { ${camelName}Schema } from './${kebabName}.validation'

export class ${name}Controller {
    static async getAll(c: Context) {
        try {
            const items = await ${name}Service.findAll()
            return c.json({
                success: true,
                message: "Success",
                data: items
            })
        } catch (error) {
            throw error
        }
    }

    static async getById(c: Context) {
        try {
            const id = c.req.param("id")
            const item = await ${name}Service.findById(id)
            return c.json({
                success: true,
                message: "Success",
                data: item
            })
        } catch (error) {
            throw error
        }
    }

    static async create(c: Context) {
        try {
            const data = await c.req.json()
            const validation = ${camelName}Schema.safeParse(data)

            if (!validation.success) {
                return c.json({
                    success: false,
                    message: "Validation Error",
                    data: validation.error
                }, 400)
            }

            const newItem = await ${name}Service.create(validation.data)
            return c.json({
                success: true,
                message: "Success",
                data: newItem
            })
        } catch (error) {
            throw error
        }
    }

    static async update(c: Context) {
        try {
            const id = c.req.param("id")
            const data = await c.req.json()
            const validation = ${camelName}Schema.safeParse(data)

            if (!validation.success) {
                return c.json({
                    success: false,
                    message: "Validation Error",
                    data: validation.error
                }, 400)
            }

            const item = await ${name}Service.findById(id)
            if (!item) {
                return c.json({
                    success: false,
                    message: "${name} not found",
                    data: null
                }, 404)
            }

            const updatedItem = await ${name}Service.update(id, validation.data)
            return c.json({
                success: true,
                message: "Success",
                data: updatedItem
            })
        } catch (error) {
            throw error
        }
    }

    static async delete(c: Context) {
        try {
            const id = c.req.param("id")
            const result = await ${name}Service.delete(id)
            return c.json({
                success: true,
                message: "Success",
                data: result
            })
        } catch (error) {
            throw error
        }
    }
}`

export const generateServiceTemplate = (name: string, kebabName: string, upperName: string): string => `
import { COLLECTIONS } from '@/config/collections.config'
import { db } from '@/shared/utils/db.util'
import { ObjectId } from 'mongodb'
import type { ${name}Data, ${name}Input } from './${kebabName}.types'

export class ${name}Service {
    static async collection() {
        return db.getDb().collection(COLLECTIONS.${upperName})
    }

    static async findAll() {
        const collection = await this.collection()
        return await collection.find().toArray()
    }

    static async findById(id: string) {
        const collection = await this.collection()
        const item = await collection.findOne({ _id: new ObjectId(id) })
        if (!item) throw new Error('${name} not found')
        return item
    }

    static async create(data: ${name}Input) {
        const collection = await this.collection()
        const newItem: ${name}Data = {
            ...data,
            _id: new ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date()
        }
        await collection.insertOne(newItem)
        return newItem
    }

    static async update(id: string, data: Partial<${name}Data>) {
        const collection = await this.collection()
        const updateData = {
            ...data,
            updatedAt: new Date()
        }
        
        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        )

        if (!result) throw new Error('${name} not found')
        return result
    }

    static async delete(id: string) {
        const collection = await this.collection()
        const result = await collection.deleteOne({ _id: new ObjectId(id) })
        if (!result.deletedCount) throw new Error('${name} not found')
        return { id }
    }
}`

export const generateRouteTemplate = (pascalName: string, kebabName: string, camelName: string): string => `
import { Hono } from 'hono'
import { ${pascalName}Controller } from './${kebabName}.controller'

export const ${camelName}Router =
    new Hono()
        .get('/', ${pascalName}Controller.getAll)
        .get('/:id', ${pascalName}Controller.getById)
        .post('/', ${pascalName}Controller.create)
        .put('/:id', ${pascalName}Controller.update)
        .delete('/:id', ${pascalName}Controller.delete)
    `