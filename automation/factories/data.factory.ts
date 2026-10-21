import { faker } from '@faker-js/faker';

export const unique = () => `${Date.now()}-${faker.string.alphanumeric(8).toLowerCase()}`;
export const customerFactory = () => ({
  name: faker.person.fullName(),
  email: `qa+${unique()}@testforge.local`,
  password: 'Quality123!',
});
export const productFactory = (
  overrides: Partial<{
    sku: string;
    name: string;
    description: string;
    priceCents: number;
    inventory: number;
    category: string;
  }> = {},
) => ({
  sku: `QA-${unique()}`.toUpperCase(),
  name: `${faker.commerce.productName()} ${unique()}`,
  description: faker.commerce.productDescription(),
  priceCents: faker.number.int({ min: 100, max: 100_000 }),
  inventory: 5,
  category: 'Automation',
  ...overrides,
});
