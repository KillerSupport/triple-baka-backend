const {
  BadRequestException,
  NotFoundException,
  ConflictException,
} = require('@nestjs/common');

// Babel does not support parameter decorators in JavaScript. Apply Nest's
// decorators directly so each controller still declares its routes and inputs.
function bindRoutes(controller, routes) {
  const prototype = controller.prototype;
  for (const [name, ...decorators] of routes) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    for (const decorator of decorators) decorator(prototype, name, descriptor);
  }
}

function input(body, fields, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadRequestException('A JSON object is required');
  }
  const result = {};
  for (const [key, { check, optional, message }] of Object.entries(fields)) {
    if (!Object.hasOwn(body, key) && (partial || optional)) continue;
    const value = typeof body[key] === 'string' ? body[key].trim() : body[key];
    if (!check(value)) throw new BadRequestException(key + ' ' + message);
    result[key] = value;
  }
  if (partial && !Object.keys(result).length) {
    throw new BadRequestException('Provide at least one editable field');
  }
  return result;
}

function text(max) {
  return {
    check: (value) =>
      typeof value === 'string' && value.length > 0 && value.length <= max,
    message: 'must contain 1 to ' + max + ' characters',
  };
}

function integer(minimum, maximum = 2147483647) {
  return {
    check: (value) =>
      Number.isInteger(value) && value >= minimum && value <= maximum,
    message: 'must be an integer between ' + minimum + ' and ' + maximum,
  };
}

function id(raw) {
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !integer(1).check(value)) {
    throw new BadRequestException('ID must be a positive integer');
  }
  return value;
}

async function findOrFail(repository, where, label) {
  const record = await repository.findOneBy(where);
  if (!record) throw new NotFoundException(label + ' not found');
  return record;
}

function translateConstraint(error) {
  if (error.code === 'ER_DUP_ENTRY')
    throw new ConflictException('Record already exists');
  if (
    ['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(error.code)
  ) {
    throw new ConflictException('A related record prevents this change');
  }
  throw error;
}

module.exports = {
  bindRoutes,
  input,
  text,
  integer,
  id,
  findOrFail,
  translateConstraint,
};
