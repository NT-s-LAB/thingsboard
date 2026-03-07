backend/
├── prisma/
│   ├── migrations/              # Database migration files
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seed data
├── src/
│   ├── common/                 # Shared utilities and base classes
│   │   ├── decorators/         # Custom decorators
│   │   ├── dto/               # Common DTOs
│   │   ├── entities/          # Base entities
│   │   ├── enums/             # Enums and constants
│   │   ├── exceptions/        # Custom exceptions
│   │   ├── filters/           # Exception filters
│   │   ├── guards/            # Auth guards
│   │   ├── interceptors/      # Response/request interceptors
│   │   ├── interfaces/        # Common interfaces
│   │   ├── pipes/             # Validation pipes
│   │   └── utils/             # Utility functions
│   ├── config/                # Configuration modules
│   │   ├── app.config.ts      # App configuration
│   │   ├── database.config.ts # Database configuration
│   │   ├── redis.config.ts    # Redis configuration
│   │   └── validation.schema.ts # Config validation
│   ├── database/              # Database setup
│   │   ├── prisma.service.ts  # Prisma service
│   │   └── database.module.ts # Database module
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication & authorization
│   │   │   ├── dto/           # Auth DTOs
│   │   │   ├── entities/      # Auth entities
│   │   │   ├── guards/        # JWT guards
│   │   │   ├── strategies/    # Passport strategies
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/             # User management
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── users.module.ts
│   │   ├── tenants/           # Multi-tenancy
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.service.ts
│   │   │   ├── tenants.repository.ts
│   │   │   └── tenants.module.ts
│   │   ├── projects/          # Project hierarchy
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── projects.repository.ts
│   │   │   └── projects.module.ts
│   │   ├── areas/             # Site/Area management
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── areas.controller.ts
│   │   │   ├── areas.service.ts
│   │   │   ├── areas.repository.ts
│   │   │   └── areas.module.ts
│   │   ├── devices/           # Device management
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── interfaces/
│   │   │   ├── devices.controller.ts
│   │   │   ├── devices.service.ts
│   │   │   ├── devices.repository.ts
│   │   │   ├── device-sync.service.ts
│   │   │   └── devices.module.ts
│   │   ├── device-types/      # Device templates
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── device-types.controller.ts
│   │   │   ├── device-types.service.ts
│   │   │   ├── device-types.repository.ts
│   │   │   └── device-types.module.ts
│   │   ├── scada/             # SCADA views & objects
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── interfaces/
│   │   │   ├── scada-views.controller.ts
│   │   │   ├── scada-objects.controller.ts
│   │   │   ├── scada.service.ts
│   │   │   ├── scada.repository.ts
│   │   │   └── scada.module.ts
│   │   ├── widgets/           # Widget library
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── widgets.controller.ts
│   │   │   ├── widgets.service.ts
│   │   │   ├── widgets.repository.ts
│   │   │   └── widgets.module.ts
│   │   ├── templates/         # Template management
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── templates.controller.ts
│   │   │   ├── templates.service.ts
│   │   │   ├── templates.repository.ts
│   │   │   └── templates.module.ts
│   │   ├── files/             # File upload/storage
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── interfaces/
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   ├── storage.service.ts
│   │   │   └── files.module.ts
│   │   ├── audit/             # Audit logging
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── audit.controller.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── audit.repository.ts
│   │   │   └── audit.module.ts
│   │   ├── realtime/          # WebSocket/SSE gateway
│   │   │   ├── dto/
│   │   │   ├── gateways/
│   │   │   ├── services/
│   │   │   ├── realtime.gateway.ts
│   │   │   ├── realtime.service.ts
│   │   │   └── realtime.module.ts
│   │   └── thingsboard/       # ThingsBoard integration
│   │       ├── dto/
│   │       ├── interfaces/
│   │       ├── services/
│   │       ├── thingsboard.controller.ts
│   │       ├── thingsboard.service.ts
│   │       ├── tb-auth.service.ts
│   │       ├── tb-device.service.ts
│   │       ├── tb-telemetry.service.ts
│   │       └── thingsboard.module.ts
│   ├── app.controller.ts      # Root controller
│   ├── app.service.ts         # Root service
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── test/                      # End-to-end tests
├── .env.example               # Environment variables template
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore rules
├── .prettierrc               # Prettier configuration
├── docker-compose.yml        # Docker setup for development
├── Dockerfile                # Docker image definition
├── nest-cli.json             # Nest CLI configuration
├── package.json              # Dependencies and scripts
├── README.md                 # Project documentation
└── tsconfig.json             # TypeScript configuration