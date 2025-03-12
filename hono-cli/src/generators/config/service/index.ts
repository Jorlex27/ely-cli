export const serviceIndexTemplate = `
import { buildMongoQuery, QueryParams } from '@/shared/pagination'
import { db } from '@/shared/utils/db.util'
import { ObjectId } from 'mongodb'
import { BaseInput, BaseModel, CustomFinder, ServiceOptions } from './types'

export class BaseService<T extends BaseModel, U extends BaseInput> {
    protected collectionName: string
    protected options: ServiceOptions<T, U>
    public customFinders: CustomFinder<T> = {}

    constructor(options: ServiceOptions<T, U>) {
        this.collectionName = options.collectionName
        this.options = options

        if (options.customFinders) {
            this.customFinders = options.customFinders
        }
    }

    protected async collection() {
        return db.getDb().collection(this.collectionName)
    }

    protected getAggregatePipeline(): any[] {
        return this.options.getAggregatePipeline ? this.options.getAggregatePipeline() : []
    }

    async findAll(params: QueryParams) {
        const collection = await this.collection()
        const query: any = buildMongoQuery(params)
        const skip = (params.page - 1) * params.limit

        const pipeline = [
            { $match: query },
            ...this.getAggregatePipeline(),
            {
                $sort: {
                    [params.fieldSort || 'createdAt']: params.order === 'asc' ? 1 : -1
                }
            },
            { $skip: skip },
            { $limit: params.limit }
        ]

        const [data, total] = await Promise.all([
            collection.aggregate(pipeline).toArray(),
            collection.countDocuments(query)
        ])

        return {
            data,
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit)
        }
    }

    async findById(id: string) {
        const collection = await this.collection()
        const items = await collection.aggregate([
            { $match: { _id: new ObjectId(id) } },
            ...this.getAggregatePipeline()
        ]).toArray()

        if (!items.length) throw new Error(\`Item not found in \${this.collectionName}\`)
        return items[0] as T
    }

    async create(data: U): Promise<T> {
        const collection = await this.collection()
        const date = new Date()

        let processedData = { ...data }
        if (this.options.beforeCreate) {
            processedData = await this.options.beforeCreate(processedData)
        }

        const newItem = {
            ...processedData,
            _id: new ObjectId(),
            createdAt: date,
            updatedAt: date
        } as unknown as T

        await collection.insertOne(newItem)
        const createdItem = await this.findById(newItem._id.toString())

        if (this.options.afterCreate) {
            return await this.options.afterCreate(createdItem)
        }

        return createdItem
    }

    async createMany(dataArray: U[]) {
        const collection = await this.collection()
        const date = new Date()

        const items = await Promise.all(
            dataArray.map(async (data) => {
                let processedData = { ...data }
                if (this.options.beforeCreate) {
                    processedData = await this.options.beforeCreate(processedData)
                }

                return {
                    ...processedData,
                    _id: new ObjectId(),
                    createdAt: date,
                    updatedAt: date
                }
            })
        )

        if (items.length === 0) return 0

        const result = await collection.insertMany(items)
        return result.insertedCount
    }

    async update(id: string, data: Partial<T>): Promise<T> {
        const collection = await this.collection()

        let updateData = { ...data, updatedAt: new Date() } as Partial<T>
        if (this.options.beforeUpdate) {
            updateData = await this.options.beforeUpdate(id, updateData)
        }

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        )

        if (!result) throw new Error(\`Item not found in \${this.collectionName}\`)

        if (this.options.afterUpdate) {
            return await this.options.afterUpdate(result as T)
        }

        return result as T
    }

    async updateMany(filter: object, data: Partial<T>) {
        const collection = await this.collection()
        const updateData = {
            ...data,
            updatedAt: new Date()
        }

        const result = await collection.updateMany(filter, { $set: updateData })
        return result.modifiedCount
    }

    async delete(id: string) {
        const collection = await this.collection()
        const result = await collection.deleteOne({ _id: new ObjectId(id) })

        if (!result.deletedCount) throw new Error(\`Item not found in \${this.collectionName}\`)
        return { id }
    }

    async deleteMany(filter: object) {
        const collection = await this.collection()
        const result = await collection.deleteMany(filter)
        return result.deletedCount
    }
}

export function createService<T extends BaseModel, U extends BaseInput>(
    options: ServiceOptions<T, U>
): BaseService<T, U> {
    return new BaseService<T, U>(options)
}`