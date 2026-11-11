// MongoDB ObjectId: 24 karakteres hexadecimális string
const isValidId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

module.exports = { isValidId };
