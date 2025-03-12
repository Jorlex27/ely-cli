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
import { createController } from '@/shared/controller'
import { ${name}Service } from './${kebabName}.service'
import { ${camelName}Schema } from './${kebabName}.validation'

const baseSantriController = createController({
    service: ${name}Service,
    validationSchema: ${camelName}Schema,
    // formatData: (data) => data,
    entityName: '${name}'
})

export const ${camelName}Controller = {
    ...baseSantriController,

    // Add your custom methods here
}`

export const generateServiceTemplate = (name: string, kebabName: string, upperName: string): string => `
import { COLLECTIONS } from '@/config/collections.config'
import { db } from '@/shared/utils/db.util'
import { BaseService, createService } from '@/shared/service'
import { ObjectId } from 'mongodb'
import type { ${name}Data, ${name}Input } from './${kebabName}.types'

export class Custom${name}Service extends BaseService<${name}Data, ${name}Input> {
    static getAggregatePipeline() {
        return []
    }
    
    // Add your custom methods here
}


const custom${name}Service = new Custom${name}Service({
    collectionName: COLLECTIONS.${upperName},
    getAggregatePipeline: Custom${name}Service.getAggregatePipeline
})

export const ${upperName}Service = createService<${name}Data, ${name}Input>({
    collectionName: COLLECTIONS.${upperName},
    getAggregatePipeline: Custom${name}Service.getAggregatePipeline

    // Add your custom methods here
})

export { Custom${name}Service }
`

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