import Ajv, { ErrorObject } from 'ajv'

function createValidator(schema: object) {
  const ajv = new Ajv()
  return ajv.compile(schema)
}

export function getLoginRequestValidator() {
  const schema = {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        minLength: 1
      },
      password: {
        type: 'string',
        minLength: 1
      }
    },
    required: ['username', 'password'],
    additionalProperties: false
  }
  return createValidator(schema)
}

export function addItemRequestValidator() {
    const schema = {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                minLength: 1
            }
        },
        required: ['content'],
        additionalProperties: false
    }
    return createValidator(schema)
}

export function updateItemRequestValidator() {
    const schema = {
        type: 'object',
        properties: {
            completed: {
                type: 'boolean'
            }
        },
        required: ['completed'],
        additionalProperties: false
    }
    return createValidator(schema)
}

type AjvValidatorError = ErrorObject<string, Record<string, any>, unknown>[] | null | undefined

export function formatAjvValidationErrors(errors: AjvValidatorError) {
  const ajv = new Ajv()
  return ajv.errorsText(errors, { separator: '\n' })
}