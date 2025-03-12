export const paginationTemplate = `import { getTahunAjaran } from "@/modules/tahun-ajaran/tahun-ajaran.get";
import { Context } from "hono";
import { ObjectId } from "mongodb";

export interface QueryParams {
    page: number;
    limit: number;
    sort?: string;
    order?: string;
    tahunAjaran?: string;
    search?: string;
    jenjangId?: string;
    fieldSort?: string;
    role?: string;
    fieldSearch?: string;
    exist?: string | boolean;
    [key: string]: any;
}

export const getPaginationParams = async (c: Context) => {
    const params = c.req.query();
    const defaultTahunAjaran = await getTahunAjaran();

    return {
        page: Number(params.page) || 1,
        limit: Number(params.limit) || 10,
        sort: params.sort,
        order: params.order || "asc",
        tahunAjaran: params.tahunAjaran || defaultTahunAjaran,
        search: params.search,
        jenjangId: params.jenjangId,
        fieldSort: params.fieldSort || "name",
        role: params.role,
        fieldSearch: params.fieldSearch || "name",
        exist: params.exist === 'true'
    };
};

export const buildMongoQuery = (params: QueryParams, additionalParams: Record<string, any> = {}, option: Record<string, any> = { tahunAjaran: true }) => {
    const query: Record<string, any> = {
        ...additionalParams,
        ...(params.search && params.fieldSearch && {
            [params.fieldSearch]: { $regex: params.search, $options: "i" }
        }),
        ...(params.jenjangId && { jenjangId: new ObjectId(params.jenjangId) }),
        ...(params.role && { role: params.role }),
        ...(option.tahunAjaran && params.tahunAjaran && { tahunAjaran: params.tahunAjaran }),
    };

    return query;
};`