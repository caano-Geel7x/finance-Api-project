import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './env.js';

const errorResponse = {
  description: 'Request failed',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
};

const jsonRequest = (schema) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const protectedResponses = {
  400: errorResponse,
  401: errorResponse,
  500: errorResponse,
};

const paths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Check API availability',
      responses: {
        200: {
          description: 'API is responding',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { status: { type: 'string', example: 'ok' } },
              },
            },
          },
        },
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a regular user account',
      description: 'The role is assigned by the server and cannot be set by the client.',
      requestBody: jsonRequest('RegisterRequest'),
      responses: {
        201: {
          description: 'Account created; returns a short-lived access token and public user profile.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
        },
        400: errorResponse,
        409: errorResponse,
        429: errorResponse,
        500: errorResponse,
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Log in with email and password',
      requestBody: jsonRequest('LoginRequest'),
      responses: {
        200: {
          description: 'Login succeeded; returns a short-lived access token and public user profile.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
        },
        400: errorResponse,
        401: errorResponse,
        429: errorResponse,
        500: errorResponse,
      },
    },
  },
  '/auth/profile': {
    get: {
      tags: ['Authentication'],
      summary: 'Get the authenticated user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Public profile for the authenticated user.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileResponse' } } },
        },
        ...protectedResponses,
      },
    },
  },
  '/categories': {
    get: {
      tags: ['Categories'],
      summary: 'List predefined categories and categories owned by the user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Categories visible to the authenticated user.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoriesResponse' } } },
        },
        ...protectedResponses,
      },
    },
    post: {
      tags: ['Categories'],
      summary: 'Create a custom category',
      security: [{ bearerAuth: [] }],
      requestBody: jsonRequest('CreateCategoryRequest'),
      responses: {
        201: {
          description: 'Category created.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CategoryResponse' } } },
        },
        ...protectedResponses,
        409: errorResponse,
      },
    },
  },
  '/transactions': {
    get: {
      tags: ['Transactions'],
      summary: 'List the authenticated user’s transactions',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] } },
        { in: 'query', name: 'categoryId', schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } },
        { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: {
        200: {
          description: 'Paginated transactions owned by the authenticated user.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TransactionListResponse' } } },
        },
        ...protectedResponses,
        404: errorResponse,
      },
    },
    post: {
      tags: ['Transactions'],
      summary: 'Create a transaction',
      description: 'The server assigns the owner. The category must be predefined or owned by the authenticated user, and its type must match.',
      security: [{ bearerAuth: [] }],
      requestBody: jsonRequest('TransactionRequest'),
      responses: {
        201: {
          description: 'Transaction created.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TransactionResponse' } } },
        },
        ...protectedResponses,
      },
    },
  },
  '/transactions/monthly-summary': {
    get: {
      tags: ['Transactions'],
      summary: 'Get income, expenses, balance, and expense totals by category',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'year', required: true, schema: { type: 'integer', minimum: 2000, maximum: 2100 } },
        { in: 'query', name: 'month', required: true, schema: { type: 'integer', minimum: 1, maximum: 12 } },
      ],
      responses: {
        200: {
          description: 'Monthly financial summary for the authenticated user.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MonthlySummaryResponse' } } },
        },
        ...protectedResponses,
      },
    },
  },
  '/transactions/{id}': {
    put: {
      tags: ['Transactions'],
      summary: 'Update a transaction owned by the authenticated user',
      description: 'Only supplied transaction fields are updated; ownerId cannot be changed.',
      security: [{ bearerAuth: [] }],
      parameters: [{
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      }],
      requestBody: jsonRequest('UpdateTransactionRequest'),
      responses: {
        200: {
          description: 'Transaction updated.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TransactionResponse' } } },
        },
        ...protectedResponses,
        404: errorResponse,
      },
    },
    delete: {
      tags: ['Transactions'],
      summary: 'Delete a transaction owned by the authenticated user',
      security: [{ bearerAuth: [] }],
      parameters: [{
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
      }],
      responses: {
        204: { description: 'Transaction deleted.' },
        ...protectedResponses,
        404: errorResponse,
      },
    },
  },
  '/upload/profile-picture': {
    post: {
      tags: ['Uploads'],
      summary: 'Upload or replace the authenticated user’s profile picture',
      description: 'Multipart file field is named image. JPEG, PNG, and WebP files up to 5 MB are accepted after content-signature validation.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: { image: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Profile picture stored and profile URL updated.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { profilePictureUrl: { type: 'string', format: 'uri' } },
              },
            },
          },
        },
        ...protectedResponses,
        400: errorResponse,
        413: errorResponse,
        415: errorResponse,
        429: errorResponse,
        503: errorResponse,
      },
    },
  },
  '/admin/overview': {
    get: {
      tags: ['Administration'],
      summary: 'Get system-level user and spending statistics',
      description: 'Admin-only. Returns aggregate totals and does not expose individual users or transactions.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Aggregate system overview.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminOverviewResponse' } } },
        },
        ...protectedResponses,
        403: errorResponse,
      },
    },
  },
};

export const openApiSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Personal Finance Tracker API',
      version: '1.0.0',
      description: 'API for user accounts, personal finance transactions, categories, and summaries.',
    },
    servers: [{ url: config.apiBaseUrl, description: 'Configured API server' }],
    tags: [
      { name: 'Health' },
      { name: 'Authentication' },
      { name: 'Categories' },
      { name: 'Transactions' },
      { name: 'Uploads' },
      { name: 'Administration' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: { error: { type: 'string', example: 'Invalid request body' } },
        },
        RegisterRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 80 },
            email: { type: 'string', format: 'email', maxLength: 254 },
            password: { type: 'string', minLength: 12, maxLength: 72, description: 'Must not exceed 72 UTF-8 bytes.' },
          },
        },
        LoginRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1, maxLength: 72 },
          },
          PublicUser: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['user', 'admin'] },
              profilePictureUrl: { type: 'string', nullable: true },
            },
          },
          AuthResponse: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
              accessToken: { type: 'string' },
            },
          },
          ProfileResponse: {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/PublicUser' } },
          },
          Category: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['income', 'expense'] },
              custom: { type: 'boolean' },
            },
          },
          CategoriesResponse: {
            type: 'object',
            properties: {
              categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            },
          },
          CategoryResponse: {
            type: 'object',
            properties: { category: { $ref: '#/components/schemas/Category' } },
          },
        },
        CreateCategoryRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'type'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
            type: { type: 'string', enum: ['income', 'expense'] },
          },
        },
        TransactionRequest: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'amount', 'type', 'categoryId', 'date'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 120 },
            amount: { type: 'string', pattern: '^(?:0|[1-9]\\d{0,8})(?:\\.\\d{1,2})?$', example: '24.50' },
            type: { type: 'string', enum: ['income', 'expense'] },
            categoryId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
            date: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            amount: { type: 'string', example: '24.50' },
            type: { type: 'string', enum: ['income', 'expense'] },
            category: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Category' }] },
            date: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TransactionResponse: {
          type: 'object',
          properties: { transaction: { $ref: '#/components/schemas/Transaction' } },
        },
        TransactionListResponse: {
          type: 'object',
          properties: {
            transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
        MonthlySummaryResponse: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                year: { type: 'integer' },
                month: { type: 'integer' },
                income: { type: 'string' },
                expense: { type: 'string' },
                balance: { type: 'string' },
                spendingByCategory: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        AdminOverviewResponse: {
          type: 'object',
          properties: {
            overview: {
              type: 'object',
              properties: {
                totalUsers: { type: 'integer' },
                topSpendingCategories: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        UpdateTransactionRequest: {
          type: 'object',
          minProperties: 1,
          additionalProperties: false,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 120 },
            amount: { type: 'string', pattern: '^(?:0|[1-9]\\d{0,8})(?:\\.\\d{1,2})?$' },
            type: { type: 'string', enum: ['income', 'expense'] },
            categoryId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
            date: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths,
  },
  apis: [],
});
