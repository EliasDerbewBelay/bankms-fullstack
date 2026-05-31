export function generateReferenceNumber(prefix: string): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${datePart}${timePart}${random}`;
}

export function generateTransactionRef(): string {
  return generateReferenceNumber('TXN');
}

export function generateLoanNumber(): string {
  return generateReferenceNumber('LN');
}

export function generateApplicationNumber(): string {
  return generateReferenceNumber('APP');
}

export function generateCustomerCode(id: number): string {
  return `CUS${id.toString().padStart(6, '0')}`;
}

export function generateEmployeeCode(id: number): string {
  return `EMP${id.toString().padStart(4, '0')}`;
}

export function generateAccountNumber(): string {
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `10${timestamp}${random}`;
}
