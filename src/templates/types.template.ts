import { toProperCase } from "@/helpers/text.helpers";

export const generateTypesTemplate = (name: string): string => `
import { ObjectId } from 'mongodb'

export interface ${toProperCase(name)}Data {
    _id: ObjectId
    // Add your data properties here
    createdAt: Date
    updatedAt: Date
}
    
export type ${toProperCase(name)}Input = Omit<${toProperCase(name)}Data, '_id' | 'createdAt' | 'updatedAt'>
`