import ValidationError from '../errors/ValidationError'

export function validateIsDefined(varName: string, varValue: unknown): void | never {
    if (varValue === undefined) {
        throw new ValidationError(`Expected ${varName} to not be undefined.`)
    }
}

export function validateIsNotEmptyString(varName: string, varValue: string): void | never {
    if (varValue.length === 0) {
        throw new ValidationError(`Expected ${varName} to not be an empty string.`)
    }
}

export function validateIsNotNegativeInteger(varName: string, varValue?: number, allowUndefined = false): void | never {
    if (allowUndefined && varValue === undefined) {
        return
    }
    validateIsDefined(varName, varValue)
    if (!Number.isInteger(varValue)) {
        throw new ValidationError(`Expected ${varName} to be an integer but was a ${typeof varValue} (${varValue}).`)
    }
    if (varValue! < 0) {
        throw new ValidationError(`Expected ${varName} to not be negative (${varValue}).`)
    }
}

export function validateIsNotEmptyByteArray(varName: string, varValue: Uint8Array): void | never {
    if (!(varValue instanceof Uint8Array) || varValue.length === 0) {
        throw new ValidationError(`Expected ${varName} to be a non-empty byte array`)
    }
}

export function validateIsType(
    varName: string,
    varValue: unknown,
    typeName: string,
    typeClass: unknown,
    allowUndefined = false
): void | never {
    if (allowUndefined && varValue === undefined) {
        return
    }
    if (!(varValue instanceof (typeClass as any))) {
        const msg = `Expected ${varName} to be an instance of (${typeName}), but it was: ${JSON.stringify(varValue)}`
        throw new ValidationError(msg)
    }
}
