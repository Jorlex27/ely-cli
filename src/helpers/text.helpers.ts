export const toCamelCase = (str: string) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

export const toPascalCase = (str: string) => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase();
    }).replace(/\s+/g, '');
}

export const toKebabCase = (str: string) => {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export const toSnakeCase = (str: string) => {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (word) => {
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    });
}

export const toProperCase = (str: string) => {
    return str.replace(/\w\S*/g, (word) => {
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    }).replace(/\s+/g, '');
}