# Ely-CLI 🦊

A powerful CLI tool for scaffolding and managing Elysia.js projects. Create new projects, generate modules, and streamline your development workflow with MongoDB integration.

## Features ✨

- Quick project initialization with best practices
- Module generation with CRUD operations
- MongoDB integration out of the box
- Swagger documentation
- Type-safe routes with Elysia
- Path aliases for better imports
- Environment configuration
- Developer-friendly CLI interface

## Installation 🚀

```bash
npm install -g ely-cli
# or
bun install -g ely-cli
```

## Usage 📚

### Create New Project

```bash
ely-cli init my-project
```

This will create a new Elysia.js project with the following structure:
```
my-project/
├── src/
│   ├── modules/      # Feature modules
│   ├── shared/       # Shared utilities and middleware
│   │   ├── middleware/
│   │   └── utils/
│   ├── config/      # Configuration files
│   ├── index.ts     # Application entry point
│   └── routes.ts    # Route manager
├── .env             # Environment variables
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

### Generate Module

```bash
ely-cli generate:module user
```

This generates a new module with:
- Controller with CRUD operations
- Service layer with MongoDB integration
- Type definitions
- Route configuration with Swagger docs
- Automatic route registration

Generated module structure:
```
src/modules/user/
├── user.controller.ts
├── user.service.ts
├── user.routes.ts
├── user.types.ts
└── index.ts
```

## Configuration 🛠

### Database

Database configuration is located in `src/config/db.config.ts`:
```typescript
export const dbConfig = {
  development: {
        url: process.env.DB_URL || 'mongodb://localhost:27017',
        name: process.env.DB_NAME || 'elysia_dev'
    },
  test: {
        url: process.env.TEST_DB_URL || 'mongodb://localhost:27017',
        name: process.env.TEST_DB_NAME || 'elysia_test',
        options: {
            maxPoolSize: 5,
            minPoolSize: 1
        }
    },
    production: {
        url: process.env.PROD_DB_URL || 'mongodb://localhost:27017',
        name: process.env.PROD_DB_NAME || 'elysia_prod',
        options: {
            maxPoolSize: 20,
            minPoolSize: 10,
            retryWrites: true,
            retryReads: true
        }
    }
}
```

### Environment Variables

Available environment variables:
```env
NODE_ENV=development
PORT=3000

# Database Configuration
DB_URL=mongodb://localhost:27017
DB_NAME=elysia_dev

# Production Database
PROD_DB_URL=mongodb://your-production-url:27017
PROD_DB_NAME=elysia_prod
```

## Commands Reference 📖

| Command | Description |
|---------|-------------|
| `ely-cli init <name>` | Create new Elysia.js project |
| `ely-cli generate:module <name>` | Generate new module with CRUD |

## Project Structure 🏗

```
src/
├── modules/           # Feature modules
│   └── user/         # Example module
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.routes.ts
│       └── user.types.ts
├── shared/
│   ├── middleware/   # Custom middleware
│   └── utils/        # Utility functions
├── config/           # Configuration files
│   ├── db.config.ts
│   └── collections.config.ts
├── index.ts          # Application entry
└── routes.ts         # Route manager
```

## Best Practices 💡

1. **Module Organization**:
   - Keep related functionality together
   - Use clear naming conventions
   - Separate concerns (controller, service, routes)

2. **Database Handling**:
   - Use services for database operations
   - Implement proper error handling
   - Follow MongoDB best practices

3. **Type Safety**:
   - Define clear interfaces
   - Use TypeScript features
   - Validate API inputs

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

MIT © [Alex Veros](mailto:alexveros46@mail.com)

## Author ✨

**Alex Veros**
- Email: alexveros46@mail.com
- GitHub: [@Jorlex27](https://github.com/Jorlex27)