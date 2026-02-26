# 📘 THINGSBOARD BACKEND DOCUMENTATION

> **Version:** 4.3.0-SNAPSHOT  
> **Framework:** Spring Boot 3.4.8  
> **Language:** Java 17  
> **Build Tool:** Maven 3.6+

---

## 📋 MỤC LỤC

1. [Kiến Trúc Tổng Quan](#-kiến-trúc-tổng-quan)
2. [Cấu Trúc Project](#-cấu-trúc-project)
3. [Tech Stack & Dependencies](#-tech-stack--dependencies)
4. [Module Architecture](#-module-architecture)
5. [Actor System](#-actor-system)
6. [Database Architecture](#-database-architecture)
7. [Message Queue](#-message-queue)
8. [Transport Protocols](#-transport-protocols)
9. [Rule Engine](#-rule-engine)
10. [Microservices Architecture](#-microservices-architecture)
11. [Configuration](#-configuration)
12. [Security](#-security)
13. [API Documentation](#-api-documentation)
14. [Build & Deployment](#-build--deployment)

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

ThingsBoard Backend được xây dựng theo **Microservices Architecture** với **Actor Model** pattern để xử lý IoT data ở quy mô lớn.

### **Architectural Layers:**

```
┌─────────────────────────────────────────────────────────┐
│              Transport Layer (Protocols)                │
│   MQTT | HTTP | CoAP | LwM2M | SNMP | gRPC              │
├─────────────────────────────────────────────────────────┤
│                 API Gateway Layer                       │
│         REST API | WebSocket | OAuth2                   │
├─────────────────────────────────────────────────────────┤
│              Application Layer (Actors)                 │
│   Device Actors | Tenant Actors | Rule Chain Actors    │
├─────────────────────────────────────────────────────────┤
│                 Service Layer                           │
│   Device Svc | Telemetry Svc | Rule Engine Svc         │
├─────────────────────────────────────────────────────────┤
│              Data Access Layer (DAO)                    │
│         JPA/Hibernate | Cassandra | TimescaleDB        │
├─────────────────────────────────────────────────────────┤
│             Message Queue & Cache                       │
│   Kafka/RabbitMQ/AWS SQS | Redis/Valkey                │
├─────────────────────────────────────────────────────────┤
│              Database Layer                             │
│    PostgreSQL | Cassandra | TimescaleDB                │
└─────────────────────────────────────────────────────────┘
```

### **Core Principles:**

1. **Actor Model** - Akka-inspired actor system cho concurrent processing
2. **Event-Driven** - Message queue-based communication
3. **Microservices** - Service-per-concern architecture
4. **Multi-tenancy** - Tenant isolation at all layers
5. **Horizontal Scalability** - Stateless services + queue-based processing
6. **Plugin Architecture** - Extensible via custom plugins & rule nodes

---

## 📁 CẤU TRÚC PROJECT

```
thingsboard/
│
├── application/                    # 🎯 Main Application Module
│   ├── src/main/java/
│   │   └── org/thingsboard/server/
│   │       ├── actors/            # Actor system implementation
│   │       │   ├── app/           # Application actors
│   │       │   ├── device/        # Device actors
│   │       │   ├── tenant/        # Tenant actors
│   │       │   ├── ruleChain/     # Rule chain actors
│   │       │   └── shared/        # Shared actor components
│   │       │
│   │       ├── service/           # Business logic services (40+ services)
│   │       │   ├── action/        # Action services
│   │       │   ├── ai/            # AI integration services
│   │       │   ├── apiusage/      # API usage tracking
│   │       │   ├── asset/         # Asset management
│   │       │   ├── device/        # Device management
│   │       │   ├── edge/          # Edge computing
│   │       │   ├── mail/          # Email services
│   │       │   ├── mobile/        # Mobile app services
│   │       │   ├── notification/  # Notification services
│   │       │   ├── ota/           # OTA updates
│   │       │   ├── profile/       # Device profiles
│   │       │   ├── queue/         # Queue management
│   │       │   ├── resource/      # Resource management
│   │       │   ├── rpc/           # RPC services
│   │       │   ├── rule/          # Rule management
│   │       │   ├── ruleengine/    # Rule engine execution
│   │       │   ├── script/        # Script execution (JS, TBEL)
│   │       │   ├── security/      # Security & auth
│   │       │   ├── session/       # Session management
│   │       │   ├── sms/           # SMS services
│   │       │   ├── subscription/  # Data subscriptions
│   │       │   ├── telemetry/     # Telemetry processing
│   │       │   ├── transport/     # Transport integration
│   │       │   └── ws/            # WebSocket services
│   │       │
│   │       ├── controller/        # REST API controllers
│   │       ├── config/            # Spring configuration
│   │       ├── install/           # Installation logic
│   │       ├── utils/             # Utilities
│   │       ├── ThingsboardServerApplication.java
│   │       └── ThingsboardInstallApplication.java
│   │
│   └── src/main/resources/
│       ├── thingsboard.yml        # Main configuration (2000+ lines)
│       ├── logback.xml            # Logging config
│       ├── sql/                   # Database schemas
│       └── data/                  # Demo data
│
├── common/                         # 📦 Common Modules (Shared Libraries)
│   ├── actor/                     # Actor framework
│   ├── cache/                     # Cache abstractions
│   ├── cluster-api/               # Cluster communication
│   ├── coap-server/               # CoAP protocol server
│   ├── dao-api/                   # DAO interfaces
│   ├── data/                      # Data models & DTOs
│   ├── discovery-api/             # Service discovery
│   ├── edge-api/                  # Edge computing API
│   ├── edqs/                      # Event-driven query system
│   ├── message/                   # Message models
│   ├── proto/                     # Protocol buffer definitions
│   ├── queue/                     # Message queue abstractions
│   ├── script/                    # Script engines (Nashorn, TBEL)
│   ├── stats/                     # Statistics
│   ├── transport/                 # Transport protocols
│   ├── util/                      # Utilities
│   └── version-control/           # Version control services
│
├── dao/                            # 💾 Data Access Layer
│   └── src/main/
│       ├── java/org/thingsboard/server/dao/
│       │   ├── alarm/             # Alarm DAO
│       │   ├── asset/             # Asset DAO
│       │   ├── audit/             # Audit log DAO
│       │   ├── customer/          # Customer DAO
│       │   ├── dashboard/         # Dashboard DAO
│       │   ├── device/            # Device DAO
│       │   ├── edge/              # Edge DAO
│       │   ├── entity/            # Generic entity DAO
│       │   ├── event/             # Event DAO
│       │   ├── model/             # Data models
│       │   ├── nosql/             # Cassandra DAOs
│       │   ├── relation/          # Entity relation DAO
│       │   ├── rule/              # Rule chain DAO
│       │   ├── sql/               # JPA/PostgreSQL DAOs
│       │   ├── telemetry/         # Telemetry DAO
│       │   ├── tenant/            # Tenant DAO
│       │   ├── timeseries/        # Time-series DAO
│       │   ├── user/              # User DAO
│       │   └── widget/            # Widget DAO
│       │
│       └── resources/
│           └── sql/               # Database schemas
│               ├── schema-entities.sql
│               ├── schema-entities-idx.sql
│               ├── schema-ts-psql.sql
│               ├── schema-ts-latest-psql.sql
│               ├── schema-timescale.sql
│               └── schema-views-and-functions.sql
│
├── rule-engine/                    # ⚙️ Rule Engine
│   ├── rule-engine-api/           # Rule engine interfaces
│   └── rule-engine-components/    # 70+ rule node implementations
│       ├── action/                # Action nodes (Email, SMS, RPC, etc.)
│       ├── enrichment/            # Enrichment nodes (Customer, Device info)
│       ├── filter/                # Filter nodes (Script, Message type)
│       ├── flow/                  # Flow control nodes (Switch, Checkpoint)
│       ├── transform/             # Transformation nodes (Script, JSON)
│       ├── external/              # External system nodes (REST, Kafka)
│       └── analytics/             # Analytics nodes (Calculate fields)
│
├── transport/                      # 🌐 Transport Protocols
│   ├── mqtt/                      # MQTT transport (Netty-based)
│   ├── http/                      # HTTP transport
│   ├── coap/                      # CoAP transport (Californium)
│   ├── lwm2m/                     # LwM2M transport (Leshan)
│   └── snmp/                      # SNMP transport
│
├── msa/                            # 🏢 Microservices Architecture
│   ├── tb/                        # TB monolith service config
│   ├── tb-node/                   # TB node service (horizontal scaling)
│   ├── js-executor/               # JavaScript executor microservice
│   ├── vc-executor/               # Version control executor
│   ├── transport/                 # Transport microservices
│   │   ├── mqtt/
│   │   ├── http/
│   │   ├── coap/
│   │   └── lwm2m/
│   ├── web-ui/                    # Web UI service
│   ├── monitoring/                # Prometheus monitoring
│   └── black-box-tests/           # Integration tests
│
├── edqs/                           # 📊 Event-Driven Query System
│   └── src/main/java/             # Advanced query engine for time-series
│
├── monitoring/                     # 📈 Monitoring & Metrics
│   └── src/main/java/             # Prometheus metrics exporters
│
├── netty-mqtt/                     # 🔌 Custom Netty MQTT
│   └── src/main/java/             # MQTT protocol implementation
│
├── tools/                          # 🛠️ Utilities & Tools
│   └── src/main/shell/            # Shell scripts & tools
│
├── rest-client/                    # 📡 REST API Client
│   └── src/main/java/             # Java client for ThingsBoard API
│
├── docker/                         # 🐳 Docker Compose Configs
│   ├── docker-compose.yml         # Main compose file
│   ├── docker-compose.postgres.yml
│   ├── docker-compose.cassandra.yml
│   ├── docker-compose.kafka.yml
│   ├── docker-compose.valkey.yml
│   └── tb-node.env               # Environment variables
│
├── packaging/                      # 📦 Packaging Scripts
│   ├── java/                      # Linux packages (DEB, RPM)
│   └── js/                        # Windows MSI installer
│
├── pom.xml                         # Root Maven POM (1900+ lines)
├── lombok.config                   # Lombok configuration
├── application.properties          # Custom app properties
└── README.md                       # Project README
```

---

## 🚀 TECH STACK & DEPENDENCIES

### **Core Framework**

```xml
<spring-boot.version>3.4.8</spring-boot.version>
<maven.compiler.source>17</maven.compiler.source>
<maven.compiler.target>17</maven.compiler.target>
```

**Spring Boot Modules:**
- `spring-boot-starter-web` - REST API
- `spring-boot-starter-websocket` - WebSocket support
- `spring-boot-starter-data-jpa` - JPA/Hibernate
- `spring-boot-starter-security` - Security
- `spring-boot-starter-actuator` - Monitoring
- `spring-boot-starter-mail` - Email services
- `spring-boot-starter-validation` - Bean validation
- `spring-boot-starter-cache` - Caching

### **Database & Persistence**

**Relational Database:**
```xml
<!-- PostgreSQL (Primary) -->
<postgresql.version>42.7.3</postgresql.version>
<hibernate.version>6.5.x</hibernate.version>
<hypersistence-utils.version>3.7.4</hypersistence-utils.version>

<!-- TimescaleDB Extension -->
<!-- Time-series data optimization -->
```

**NoSQL Database:**
```xml
<!-- Cassandra (Optional for TS data) -->
<cassandra.version>4.17.0</cassandra.version>
<cassandra-all.version>5.0.4</cassandra-all.version>
```

**JPA/Hibernate:**
- Entity mapping
- Query optimization
- Multi-tenancy support
- Custom types (JSONB, Array)

### **Message Queue**

**Apache Kafka (Default):**
```xml
<kafka.version>3.9.1</kafka.version>
```
- Telemetry ingestion
- Rule engine messages
- Inter-service communication
- Event sourcing

**Alternatives:**
- RabbitMQ
- AWS SQS
- Google Pub/Sub
- Azure Service Bus
- In-Memory (for development)

### **Cache**

**Redis/Valkey:**
```xml
<jedis.version>5.1.5</jedis.version>
```
- Session storage
- Device state cache
- Attribute cache
- Rate limiting

**Caffeine (In-memory):**
- Local caching
- L1 cache layer

### **Security**

```xml
<jjwt.version>0.12.5</jjwt.version>              <!-- JWT tokens -->
<bouncycastle.version>1.78.1</bouncycastle.version> <!-- Encryption -->
<nimbus-jose-jwt.version>10.0.2</nimbus-jose-jwt.version>
<passay.version>1.6.4</passay.version>           <!-- Password validation -->
```

**Authentication:**
- JWT (JSON Web Tokens)
- OAuth2 (Google, GitHub, Auth0, etc.)
- Basic auth
- X.509 certificates (for devices)

**Authorization:**
- Role-based access control (RBAC)
- Resource-level permissions
- Multi-tenancy isolation

### **IoT Protocols**

**MQTT:**
```xml
<netty.version>4.1.124.Final</netty.version>     <!-- Custom Netty MQTT -->
<paho.client.version>1.2.5</paho.client.version> <!-- MQTT client -->
```

**CoAP:**
```xml
<californium.version>3.12.1</californium.version> <!-- CoAP server -->
```

**LwM2M:**
```xml
<leshan.version>2.0.0-M15</leshan.version>       <!-- LwM2M server -->
```

**OPC-UA:**
```xml
<milo.version>0.6.12</milo.version>              <!-- OPC-UA client -->
```

**SNMP:**
```xml
<snmp4j.version>3.8.0</snmp4j.version>           <!-- SNMP support -->
```

### **Scripting & Rule Engine**

```xml
<tbel.version>1.2.8</tbel.version>                      <!-- ThingsBoard Expression Language -->
<nashorn-core.version>15.4</nashorn-core.version>       <!-- JavaScript engine -->
<delight-nashorn-sandbox.version>0.4.5</delight-nashorn-sandbox.version>
<langchain4j.version>1.1.0</langchain4j.version>        <!-- AI/LLM integration -->
```

**Script Engines:**
- **TBEL** (ThingsBoard Expression Language) - Fast, secure
- **JavaScript (Nashorn)** - Legacy support
- **GraalVM JS** - Performance-optimized JS

### **API & Documentation**

```xml
<springdoc-swagger.version>2.8.8TB</springdoc-swagger.version>
<swagger-annotations.version>2.2.30</swagger-annotations.version>
```

**API Features:**
- OpenAPI 3.0 specification
- Swagger UI at `/swagger-ui.html`
- Interactive API testing

### **Monitoring & Metrics**

```xml
<!-- Micrometer + Prometheus -->
<micrometer.version>1.x</micrometer.version>
```

**Metrics:**
- JVM metrics
- Database connection pools
- Queue statistics
- Actor system metrics
- Custom business metrics

### **Utilities**

```xml
<guava.version>33.1.0-jre</guava.version>
<commons-lang3.version>3.18.0</commons-lang3.version>
<commons-io.version>2.16.1</commons-io.version>
<commons-csv.version>1.10.0</commons-csv.version>
<lombok.version>1.18.38</lombok.version>
<jackson.version>2.18.x</jackson.version>
```

**Lombok Features:**
- `@Data`, `@Builder`, `@Slf4j`
- Reduces boilerplate code
- Compile-time code generation

### **Geospatial**

```xml
<spatial4j.version>0.8</spatial4j.version>
<jts.version>1.19.0</jts.version>
```

**Features:**
- Geofencing
- Distance calculations
- Polygon containment

### **Notifications**

```xml
<twilio.version>10.1.3</twilio.version>           <!-- SMS via Twilio -->
<slack-api.version>1.39.0</slack-api.version>     <!-- Slack notifications -->
<firebase-admin.version>9.2.0</firebase-admin.version> <!-- Push notifications -->
```

**Channels:**
- Email (SMTP)
- SMS (Twilio, AWS SNS)
- Slack
- Push notifications (FCM)
- Webhooks

### **Service Discovery & Clustering**

```xml
<curator.version>5.6.0</curator.version>
<zookeeper.version>3.9.3</zookeeper.version>
```

**Zookeeper Usage:**
- Service discovery
- Leader election
- Distributed locks
- Configuration management

### **Rate Limiting**

```xml
<bucket4j.version>8.10.1</bucket4j.version>
```

**Features:**
- Token bucket algorithm
- Per-tenant rate limits
- Per-device rate limits
- API endpoint rate limits

### **File Storage**

```xml
<aws.sdk.version>1.12.701</aws.sdk.version>
<pubsub.client.version>1.128.1</pubsub.client.version>
```

**Storage Backends:**
- Local filesystem
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

### **Version Control**

```xml
<jgit.version>6.10.1</jgit.version>
```

**Features:**
- Entity versioning
- Configuration rollback
- Audit trail

### **Testing**

```xml
<junit.version>5.x</junit.version>
<mockito.version>5.x</mockito.version>
<testcontainers.version>1.20.6</testcontainers.version>
<testng.version>7.10.1</testng.version>
```

**Test Types:**
- Unit tests (JUnit 5)
- Integration tests (Testcontainers)
- Blackbox tests (TestNG)

---

## 🧩 MODULE ARCHITECTURE

### **1. Application Module** (`application/`)

**Entry Point:**
```java
@SpringBootConfiguration
@EnableAsync
@EnableScheduling
@ComponentScan({"org.thingsboard.server", "org.thingsboard.script"})
public class ThingsboardServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ThingsboardServerApplication.class, args);
    }
}
```

**Responsibilities:**
- Main application orchestration
- Actor system initialization
- Service layer coordination
- REST API endpoints
- WebSocket handling

**Key Components:**
- **Controllers** - 40+ REST controllers
- **Services** - 50+ business logic services
- **Actors** - Actor system implementation
- **Configuration** - Spring Boot configs

### **2. Common Module** (`common/`)

**Sub-modules:**

**Actor Framework:**
```
common/actor/
├── ActorService         # Actor lifecycle management
├── ActorContext         # Actor context & state
├── TbActorSystem        # Main actor system
└── DefaultActorService  # Default implementation
```

**Data Models:**
```
common/data/
├── Device              # Device model
├── Asset               # Asset model
├── Tenant              # Tenant model
├── Customer            # Customer model
├── User                # User model
├── Dashboard           # Dashboard model
├── RuleChain           # Rule chain model
└── Alarm               # Alarm model
```

**Queue Abstractions:**
```
common/queue/
├── TbQueueProducer     # Message producer interface
├── TbQueueConsumer     # Message consumer interface
├── QueueService        # Queue service
└── Implementations:
    ├── KafkaQueueService
    ├── RabbitMqQueueService
    ├── AwsSqsQueueService
    └── InMemoryQueueService
```

**Cache Abstractions:**
```
common/cache/
├── CacheSpecsMap       # Cache configurations
├── TBCacheManager      # Cache manager
└── Implementations:
    ├── RedisCacheManager
    └── CaffeineCacheManager
```

**Transport:**
```
common/transport/
├── TransportService    # Transport lifecycle
├── SessionManager      # Session management
├── DeviceSessionCtx    # Device session context
└── Protocol implementations
```

### **3. DAO Module** (`dao/`)

**Database Abstraction:**
```java
public interface EntityDao<T> {
    T save(TenantId tenantId, T entity);
    T findById(TenantId tenantId, UUID id);
    PageData<T> findByTenantId(TenantId tenantId, PageLink pageLink);
    boolean removeById(TenantId tenantId, UUID id);
}
```

**DAO Implementations:**

**SQL (PostgreSQL):**
```
dao/sql/
├── JpaDeviceDao
├── JpaAssetDao
├── JpaTenantDao
├── JpaUserDao
├── JpaTelemetryDao
└── ... (30+ DAO classes)
```

**NoSQL (Cassandra - Optional):**
```
dao/nosql/
├── CassandraDeviceDao
├── CassandraTelemetryDao
└── CassandraTimeseriesDao
```

**Key Features:**
- Multi-database support
- JPA/Hibernate for entities
- Optimized time-series queries
- Partitioning strategies
- Caching layer integration

### **4. Rule Engine Module** (`rule-engine/`)

**Architecture:**
```
rule-engine/
├── rule-engine-api/           # Interfaces & models
│   ├── TbNode                # Rule node interface
│   ├── TbNodeConfiguration   # Node config
│   └── TbContext             # Execution context
│
└── rule-engine-components/    # 70+ node implementations
    ├── action/
    │   ├── TbLogNode
    │   ├── TbMsgPushToEdgeNode
    │   ├── TbSendEmailNode
    │   ├── TbSendSmsNode
    │   └── TbCreateAlarmNode
    │
    ├── filter/
    │   ├── TbJsFilterNode
    │   ├── TbMsgTypeFilterNode
    │   └── TbCheckMessageNode
    │
    ├── enrichment/
    │   ├── TbGetAttributesNode
    │   ├── TbGetDeviceNode
    │   └── TbGetCustomerNode
    │
    ├── transform/
    │   ├── TbTransformMsgNode
    │   └── TbChangeOriginatorNode
    │
    └── external/
        ├── TbRestApiCallNode
        ├── TbKafkaNode
        └── TbSendRPCRequestNode
```

**Rule Node Lifecycle:**
```java
public interface TbNode {
    void init(TbContext ctx, TbNodeConfiguration configuration);
    void onMsg(TbContext ctx, TbMsg msg);
    void destroy();
}
```

### **5. Transport Module** (`transport/`)

**MQTT Transport:**
```
transport/mqtt/
├── MqttTransportService    # MQTT server
├── MqttTransportHandler    # Protocol handler
├── MqttSessionHandler      # Session management
└── Features:
    ├── MQTT v3.1.1 & v5.0
    ├── QoS 0, 1, 2
    ├── SSL/TLS support
    ├── X.509 auth
    └── Device provisioning
```

**HTTP Transport:**
```
transport/http/
├── HttpTransportService    # HTTP API server
├── DeviceApiController     # Device API endpoints
└── Features:
    ├── REST API for devices
    ├── Telemetry upload
    ├── Attribute requests
    ├── RPC support
    └── Token-based auth
```

**CoAP Transport:**
```
transport/coap/
├── CoapTransportService    # CoAP server (Californium)
├── CoapTransportHandler
└── Features:
    ├── CoAP protocol
    ├── DTLS security
    ├── Observe pattern
    └── Resource discovery
```

**LwM2M Transport:**
```
transport/lwm2m/
├── LwM2mTransportService   # LwM2M server (Leshan)
├── LwM2mDeviceProfileCache
└── Features:
    ├── LwM2M protocol
    ├── Bootstrap server
    ├── Device management
    ├── Firmware updates (FOTA)
    └── Object model support
```

### **6. MSA Module** (`msa/`)

**Microservices:**

**TB Node:**
```
msa/tb-node/
├── Application entry point for horizontal scaling
├── Shares same codebase as monolith
└── Kafka-based message distribution
```

**JS Executor:**
```
msa/js-executor/
├── Isolated JavaScript execution
├── Sandboxed environment
├── Queue-based job processing
└── Horizontal scaling support
```

**VC Executor:**
```
msa/vc-executor/
├── Version control operations
├── Git integration
├── Entity versioning
└── Async processing
```

**Transport Microservices:**
```
msa/transport/
├── mqtt/    # Standalone MQTT transport
├── http/    # Standalone HTTP transport
├── coap/    # Standalone CoAP transport
└── lwm2m/   # Standalone LwM2M transport
```

---

## 🎭 ACTOR SYSTEM

ThingsBoard sử dụng **Actor Model** pattern (inspired by Akka) để xử lý concurrent messages với high throughput.

### **Actor Hierarchy:**

```
┌────────────────────────────────────────┐
│        App Actor (Root)                │
│  - Actor system initialization         │
│  - Lifecycle management                │
└────────────┬───────────────────────────┘
             │
    ┌────────┴────────┬──────────────────┐
    │                 │                  │
┌───▼────┐    ┌──────▼─────┐    ┌──────▼─────┐
│ Tenant │    │  Stats     │    │  Rule      │
│ Actors │    │  Actor     │    │  Chain     │
└───┬────┘    └────────────┘    │  Root      │
    │                            └────────────┘
    │
┌───▼────────────────────────────┐
│   Tenant Actor                 │
│   - Per-tenant message queue   │
│   - Device actor management    │
│   - Rule chain orchestration   │
└───┬────────────────────────────┘
    │
    ├─────────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐  ┌──▼───┐  ┌──▼────────┐
│Device │ │Device│  │Device│  │ Rule Chain│
│Actor  │ │Actor │  │Actor │  │ Actor     │
│  #1   │ │  #2  │  │  #N  │  │           │
└───────┘ └──────┘  └──────┘  └───────────┘
```

### **Actor Types:**

**1. App Actor (Root):**
```java
public class AppActor extends ContextAwareActor {
    // Root actor - manages tenant actors
    // Handles system-level operations
    // Routes messages to tenant actors
}
```

**2. Tenant Actor:**
```java
public class TenantActor extends ContextAwareActor {
    // Per-tenant isolation
    // Manages device actors
    // Routes rule chain messages
    // Handles tenant-level operations
}
```

**3. Device Actor:**
```java
public class DeviceActor extends ContextAwareActor {
    // Per-device state management
    // Telemetry processing
    // Attribute updates
    // RPC handling
    // Session management
}
```

**4. Rule Chain Actor:**
```java
public class RuleChainActor extends ContextAwareActor {
    // Rule chain execution
    // Message routing
    // Node execution
    // Error handling
}
```

### **Message Flow:**

```
Device → Transport → Queue → Tenant Actor → Device Actor → Rule Chain Actor
                                    ↓
                              Telemetry Service
                                    ↓
                                Database
```

### **Actor Benefits:**

✅ **Concurrency** - Each actor processes messages sequentially (no locks)  
✅ **Isolation** - Actor state is private  
✅ **Scalability** - Millions of actors can exist  
✅ **Fault Tolerance** - Supervisor strategy for failure handling  
✅ **Location Transparency** - Actors can be local or remote

---

## 💾 DATABASE ARCHITECTURE

### **Primary Database: PostgreSQL**

**Schema Structure:**

```sql
-- Entities (Devices, Assets, Users, etc.)
CREATE TABLE device (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255),
    label VARCHAR(255),
    additional_info JSONB,
    created_time BIGINT,
    ...
);

-- Attributes (Key-Value pairs)
CREATE TABLE attribute_kv (
    entity_id UUID NOT NULL,
    attribute_type VARCHAR(32) NOT NULL,
    attribute_key VARCHAR(255) NOT NULL,
    bool_v BOOLEAN,
    str_v VARCHAR(10000000),
    long_v BIGINT,
    dbl_v DOUBLE PRECISION,
    json_v JSONB,
    last_update_ts BIGINT,
    PRIMARY KEY (entity_id, attribute_type, attribute_key)
);

-- Time-series (Telemetry)
CREATE TABLE ts_kv (
    entity_id UUID NOT NULL,
    key VARCHAR(255) NOT NULL,
    ts BIGINT NOT NULL,
    bool_v BOOLEAN,
    str_v VARCHAR(10000000),
    long_v BIGINT,
    dbl_v DOUBLE PRECISION,
    json_v JSONB,
    PRIMARY KEY (entity_id, key, ts)
);

-- Latest Time-series (Fast access)
CREATE TABLE ts_kv_latest (
    entity_id UUID NOT NULL,
    key VARCHAR(255) NOT NULL,
    ts BIGINT NOT NULL,
    bool_v BOOLEAN,
    str_v VARCHAR(10000000),
    long_v BIGINT,
    dbl_v DOUBLE PRECISION,
    json_v JSONB,
    PRIMARY KEY (entity_id, key)
);
```

**Key Features:**

**1. Partitioning:**
```sql
-- Partition ts_kv by time
CREATE TABLE ts_kv_2024_01 PARTITION OF ts_kv
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

**2. Indexes:**
```sql
-- Optimized indexes for common queries
CREATE INDEX idx_device_tenant_id ON device(tenant_id);
CREATE INDEX idx_device_customer_id ON device(customer_id);
CREATE INDEX idx_ts_kv_entity_key ON ts_kv(entity_id, key);
```

**3. JSONB:**
```sql
-- Flexible schema using JSONB
SELECT additional_info->>'manufacturer' FROM device
WHERE additional_info @> '{"active": true}';
```

### **TimescaleDB Extension (Optional)**

**Hypertable:**
```sql
-- Convert ts_kv to hypertable
SELECT create_hypertable('ts_kv', 'ts', 
    chunk_time_interval => 86400000000);  -- 1 day chunks
```

**Benefits:**
- Automatic chunking
- Time-based retention policies
- Compression
- Continuous aggregates

**Example - Retention Policy:**
```sql
SELECT add_retention_policy('ts_kv', 
    INTERVAL '90 days');  -- Keep last 90 days
```

### **Cassandra (Alternative for Time-Series)**

**Schema:**
```cql
CREATE TABLE ts_kv_cf (
    entity_type text,
    entity_id uuid,
    key text,
    partition bigint,
    ts bigint,
    bool_v boolean,
    str_v text,
    long_v bigint,
    dbl_v double,
    json_v text,
    PRIMARY KEY ((entity_type, entity_id, key, partition), ts)
) WITH CLUSTERING ORDER BY (ts DESC);
```

**Use Cases:**
- Massive telemetry volume (millions of writes/sec)
- Multi-datacenter replication
- Time-series analytics

### **Data Partitioning Strategies**

**1. Multi-tenancy:**
```sql
-- All tables have tenant_id for isolation
WHERE tenant_id = :tenantId
```

**2. Time-based:**
```sql
-- Partition by month/year
CREATE TABLE ts_kv_2024_01 ...
CREATE TABLE ts_kv_2024_02 ...
```

**3. Hash-based:**
```sql
-- Distribute by entity_id hash
CREATE TABLE ts_kv PARTITION BY HASH(entity_id);
```

---

## 📨 MESSAGE QUEUE

### **Queue Architecture**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Producer   │───▶│  Kafka/RMQ   │───▶│   Consumer   │
│  (Transport) │    │   Brokers    │    │  (Rule Eng.) │
└──────────────┘    └──────────────┘    └──────────────┘
```

### **Queue Types**

**1. Main Queue:**
```yaml
# Full telemetry processing
queue.main:
  topic: tb_core.main
  partitions: 10
  replication-factor: 1
```

**2. Transport API Queue:**
```yaml
# Device messages from transports
queue.transport-api:
  topic: tb_transport.api.requests
  partitions: 10
```

**3. Rule Engine Queues:**
```yaml
# Dynamic queues per rule chain
queue.rule-engine:
  topic: tb_rule_engine.<queue-name>
  partitions: 10
```

**4. Notification Queue:**
```yaml
# Notifications (email, SMS, etc.)
queue.notifications:
  topic: tb_core.notifications
  partitions: 1
```

**5. JS Executor Queue:**
```yaml
# JavaScript execution requests
queue.js-executor:
  topic: tb_js_executor.requests
  partitions: 10
```

### **Message Format**

```java
public class TbMsg {
    String type;              // "POST_TELEMETRY_REQUEST"
    EntityId originator;      // Device/Asset/Customer
    CustomerId customerId;
    TbMsgMetaData metaData;   // Headers, timestamps
    String data;              // JSON payload
    TbMsgProcessingCtx ctx;   // Processing context
}
```

### **Queue Providers**

**Apache Kafka (Recommended):**
```yaml
queue:
  type: kafka
  kafka:
    bootstrap-servers: localhost:9092
    acks: all
    retries: 1
    batch-size: 16384
    linger-ms: 1
```

**RabbitMQ:**
```yaml
queue:
  type: rabbitmq
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

**AWS SQS:**
```yaml
queue:
  type: aws-sqs
  aws-sqs:
    access-key-id: ${AWS_ACCESS_KEY_ID}
    secret-access-key: ${AWS_SECRET_ACCESS_KEY}
    region: us-east-1
```

**In-Memory (Development):**
```yaml
queue:
  type: in-memory
```

---

## 🌐 TRANSPORT PROTOCOLS

### **Supported Protocols**

| Protocol | Port  | Use Case              | Security            |
|----------|-------|-----------------------|---------------------|
| MQTT     | 1883  | Real-time devices     | TLS, X.509          |
| HTTP     | 8080  | REST API              | JWT, OAuth2         |
| CoAP     | 5683  | Constrained devices   | DTLS                |
| LwM2M    | 5685  | Device management     | DTLS, Bootstrap     |
| SNMP     | 161   | Network devices       | SNMPv3              |
| gRPC     | 9090  | Microservices         | mTLS                |

### **MQTT Protocol**

**Topics:**
```
v1/devices/me/telemetry       # Publish telemetry
v1/devices/me/attributes      # Publish attributes
v1/devices/me/attributes/request/<requestId>  # Request attributes
v1/devices/me/attributes/response/<requestId> # Receive attributes
v1/devices/me/rpc/request/<requestId>         # RPC request
v1/devices/me/rpc/response/<requestId>        # RPC response
```

**Authentication:**
```bash
# Token-based
mosquitto_pub -h localhost -p 1883 \
  -u "ACCESS_TOKEN" \
  -t "v1/devices/me/telemetry" \
  -m '{"temperature": 25.5}'
```

**Payload Format:**
```json
{
  "temperature": 25.5,
  "humidity": 60,
  "pressure": 1013.25
}
```

### **HTTP Protocol**

**Telemetry:**
```bash
POST /api/v1/{accessToken}/telemetry
Content-Type: application/json

{
  "temperature": 25.5,
  "humidity": 60
}
```

**Attributes:**
```bash
GET /api/v1/{accessToken}/attributes?clientKeys=attribute1,attribute2
POST /api/v1/{accessToken}/attributes

{
  "firmware_version": "1.2.3"
}
```

**RPC:**
```bash
POST /api/v1/{accessToken}/rpc
{
  "method": "setValue",
  "params": {"pin": 7, "value": 1}
}
```

### **CoAP Protocol**

**Endpoints:**
```
coap://localhost:5683/api/v1/{accessToken}/telemetry
coap://localhost:5683/api/v1/{accessToken}/attributes
coap://localhost:5683/api/v1/{accessToken}/rpc
```

**Example:**
```bash
coap-client -m post coap://localhost:5683/api/v1/ACCESS_TOKEN/telemetry \
  -e '{"temperature":25.5}'
```

### **LwM2M Protocol**

**Objects:**
- Object 3: Device (manufacturer, model, serial)
- Object 4: Connectivity Monitoring
- Object 5: Firmware Update
- Object 6: Location
- Custom objects

**Features:**
- Bootstrap server
- Read/Write/Execute operations
- Observe (notifications)
- Firmware updates (FOTA)

---

## ⚙️ RULE ENGINE

### **Architecture**

```
┌─────────┐    ┌──────────────┐    ┌──────────────┐
│ Message │───▶│  Rule Chain  │───▶│  Rule Nodes  │
│  Queue  │    │    Actor     │    │  (70+ types) │
└─────────┘    └──────────────┘    └──────┬───────┘
                                           │
                       ┌───────────────────┼──────────────┐
                       │                   │              │
                  ┌────▼────┐        ┌────▼────┐   ┌────▼────┐
                  │ Filter  │        │Transform│   │ Action  │
                  │  Nodes  │        │  Nodes  │   │  Nodes  │
                  └─────────┘        └─────────┘   └─────────┘
```

### **Rule Chain Flow**

```
Input → Filter → Enrichment → Transformation → Action → Output
```

### **Rule Node Categories**

**1. Filter Nodes:**
- Message Type Filter
- Script Filter (JS/TBEL)
- Originator Type Filter
- Message Type Switch
- Check Fields Existence

**2. Enrichment Nodes:**
- Customer Details
- Device Info
- Related Entity Attributes
- Originator Attributes
- Tenant Details

**3. Transformation Nodes:**
- Script Transformation
- Change Originator
- To Email
- Rename Keys
- Calculate Delta

**4. Action Nodes:**
- Create Alarm
- Clear Alarm
- Log
- RPC Call Request
- Save Telemetry
- Save Attributes
- Send Email
- Send SMS
- Push to Edge

**5. External Nodes:**
- REST API Call
- Kafka
- RabbitMQ
- AWS SNS
- Azure IoT Hub

**6. Flow Control Nodes:**
- Checkpoint
- Delay
- Generator
- Rate Limit

### **Example: Temperature Alert**

```json
{
  "nodes": [
    {
      "type": "SCRIPT_FILTER",
      "name": "High Temperature",
      "configuration": {
        "scriptLang": "TBEL",
        "script": "return msg.temperature > 30;"
      }
    },
    {
      "type": "CREATE_ALARM",
      "name": "Create Alarm",
      "configuration": {
        "alarmType": "High Temperature",
        "severity": "WARNING",
        "scriptLang": "TBEL",
        "alarmDetailsScript": "return {temperature: msg.temperature};"
      }
    },
    {
      "type": "SEND_EMAIL",
      "name": "Send Email",
      "configuration": {
        "to": "admin@example.com",
        "subject": "Temperature Alert",
        "body": "Temperature exceeded threshold: ${temperature}"
      }
    }
  ],
  "connections": [
    {"fromIndex": 0, "toIndex": 1, "type": "True"},
    {"fromIndex": 1, "toIndex": 2, "type": "Created"}
  ]
}
```

### **TBEL (ThingsBoard Expression Language)**

**Features:**
- Fast & secure (no eval)
- Type-safe
- Built-in functions
- JSON path access

**Example:**
```javascript
// Access message data
var temp = msg.temperature;
var humidity = msg.humidity;

// Calculations
var heatIndex = calculateHeatIndex(temp, humidity);

// Conditional logic
if (temp > 30) {
  return {alarm: true, level: "HIGH"};
}

// JSON transformation
return {
  deviceName: metadata.deviceName,
  temperature: temp,
  timestamp: metadata.ts
};
```

---

## 🏢 MICROSERVICES ARCHITECTURE

### **Deployment Modes**

**1. Monolith (Default):**
```
┌─────────────────────────────────────┐
│     ThingsBoard Monolith            │
│  - HTTP API                         │
│  - WebSocket                        │
│  - MQTT/CoAP/HTTP Transports        │
│  - Rule Engine                      │
│  - Core Services                    │
└─────────────────────────────────────┘
```

**2. Microservices (Production):**
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ TB Node  │  │ TB Node  │  │ TB Node  │
│   #1     │  │   #2     │  │   #3     │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
        ┌──────────▼──────────┐
        │   Kafka Cluster     │
        └──────────┬──────────┘
                   │
     ┌─────────────┼──────────────┐
     │             │              │
┌────▼─────┐  ┌───▼────┐  ┌─────▼────┐
│ MQTT Svc │  │HTTP Svc│  │ CoAP Svc │
└──────────┘  └────────┘  └──────────┘
```

### **Service Types**

**TB Node (Core):**
```yaml
# Horizontal scaling
# Stateless
# Queue-based processing
# Handles:
  - Rule engine execution
  - REST API
  - WebSocket
  - Core services
```

**Transport Services:**
```yaml
# MQTT Transport
  - MQTT protocol handling
  - Device authentication
  - Message forwarding to queue

# HTTP Transport
  - REST API for devices
  - Token validation
  - Message forwarding

# CoAP Transport
  - CoAP protocol handling
  - DTLS security

# LwM2M Transport
  - LwM2M server
  - Bootstrap server
  - Device management
```

**JS Executor:**
```yaml
# Isolated JavaScript execution
# Sandboxed environment
# Handles:
  - Rule node scripts
  - Widget scripts
  - Decoder scripts
```

**VC Executor:**
```yaml
# Version control operations
# Git integration
# Async processing
```

**Web UI:**
```yaml
# Static file serving
# Angular SPA
# CDN-friendly
```

### **Service Discovery (Zookeeper)**

```yaml
zk:
  enabled: true
  url: localhost:2181
  retry_interval_ms: 3000
  connection_timeout_ms: 3000
  session_timeout_ms: 3000
```

**Features:**
- Service registration
- Health checks
- Leader election
- Configuration sync

---

## ⚙️ CONFIGURATION

### **Main Configuration File**

**Location:** `application/src/main/resources/thingsboard.yml`

**Size:** 2000+ lines of configuration

### **Key Sections**

**1. Server:**
```yaml
server:
  address: "${HTTP_BIND_ADDRESS:0.0.0.0}"
  port: "${HTTP_BIND_PORT:8080}"
  ssl:
    enabled: "${SSL_ENABLED:false}"
```

**2. Database:**
```yaml
spring:
  datasource:
    url: "${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/thingsboard}"
    username: "${SPRING_DATASOURCE_USERNAME:postgres}"
    password: "${SPRING_DATASOURCE_PASSWORD:postgres}"
  jpa:
    hibernate:
      ddl-auto: none
    database-platform: org.hibernate.dialect.PostgreSQLDialect
```

**3. Cache:**
```yaml
cache:
  type: "${CACHE_TYPE:caffeine}"  # caffeine or redis
  specs:
    devices:
      timeToLiveInMinutes: 1440
      maxSize: 10000
    sessions:
      timeToLiveInMinutes: 1440
      maxSize: 10000
```

**4. Queue:**
```yaml
queue:
  type: "${TB_QUEUE_TYPE:kafka}"  # kafka, rabbitmq, aws-sqs, in-memory
  kafka:
    bootstrap-servers: "${TB_KAFKA_SERVERS:localhost:9092}"
    acks: all
    retries: 1
```

**5. Actors:**
```yaml
actors:
  tenant:
    create_components_on_init: true
  rule:
    # Rule engine thread pools
    db_callback_thread_pool_size: 50
    js_thread_pool_size: 50
    mail_thread_pool_size: 50
```

**6. MQTT:**
```yaml
transport:
  mqtt:
    bind_address: "${MQTT_BIND_ADDRESS:0.0.0.0}"
    bind_port: "${MQTT_BIND_PORT:1883}"
    timeout: "${MQTT_TIMEOUT:10000}"
    ssl:
      enabled: "${MQTT_SSL_ENABLED:false}"
```

**7. Security:**
```yaml
security:
  jwt:
    tokenExpirationTime: "${JWT_TOKEN_EXPIRATION_TIME:9000}"
    refreshTokenExpTime: "${JWT_REFRESH_TOKEN_EXPIRATION_TIME:604800}"
    tokenIssuer: "${JWT_TOKEN_ISSUER:thingsboard.io}"
    tokenSigningKey: "${JWT_TOKEN_SIGNING_KEY:thingsboardDefaultSigningKey}"
```

### **Environment Variables**

**Database:**
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/thingsboard
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
```

**Queue:**
```bash
TB_QUEUE_TYPE=kafka
TB_KAFKA_SERVERS=localhost:9092
```

**Cache:**
```bash
CACHE_TYPE=redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🔐 SECURITY

### **Authentication Methods**

**1. JWT (JSON Web Tokens):**
```java
// Login endpoint
POST /api/auth/login
{
  "username": "tenant@thingsboard.org",
  "password": "tenant"
}

// Response
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**2. OAuth2:**
```yaml
security:
  oauth2:
    - clientId: "${OAUTH2_GOOGLE_CLIENT_ID}"
      clientSecret: "${OAUTH2_GOOGLE_CLIENT_SECRET}"
      providerName: "Google"
      scope: "email,profile"
```

**Supported Providers:**
- Google
- GitHub
- Auth0
- Okta
- Azure AD
- Custom OAuth2

**3. Device Authentication:**

**Access Token:**
```bash
# Static token per device
curl -v -X POST http://localhost:8080/api/v1/ACCESS_TOKEN/telemetry \
  -d '{"temperature":25}'
```

**X.509 Certificates:**
```yaml
mqtt:
  ssl:
    enabled: true
    credentials:
      type: PEM
      cert_file: mqtt-server.pem
      key_file: mqtt-server-key.pem
```

### **Authorization (RBAC)**

**User Authorities:**
```java
public enum Authority {
    SYS_ADMIN,        // System administrator
    TENANT_ADMIN,     // Tenant administrator
    CUSTOMER_USER     // Customer user
}
```

**Resource Permissions:**
```java
@PreAuthorize("hasAnyAuthority('SYS_ADMIN', 'TENANT_ADMIN')")
public Device saveDevice(Device device) { ... }
```

### **Multi-tenancy Isolation**

**Database:**
```sql
-- All queries filtered by tenant_id
SELECT * FROM device WHERE tenant_id = :tenantId;
```

**Actors:**
```java
// Separate actor hierarchy per tenant
TenantActor(tenantId) → DeviceActor(tenantId, deviceId)
```

**Queue:**
```java
// Partitioning by tenant
partition = hash(tenantId) % partitionCount
```

### **Rate Limiting**

```yaml
security:
  rate_limits:
    # Per-tenant limits
    tenant:
      max_entities_per_tenant: 10000
      max_devices_per_tenant: 10000
    # API rate limits
    api:
      rest:
        limits: "100:1,1000:60"  # 100/sec, 1000/min
```

**Implementation:**
```java
@RateLimit(
    value = "100:1,1000:60",
    keys = {"#tenantId"}
)
public PageData<Device> getDevices(TenantId tenantId) { ... }
```

### **Encryption**

**At Rest:**
- Database encryption (PostgreSQL TDE)
- Encrypted attributes
- Secrets management

**In Transit:**
- TLS/SSL for all protocols
- mTLS for microservices
- DTLS for CoAP/LwM2M

---

## 📡 API DOCUMENTATION

### **REST API**

**Base URL:** `http://localhost:8080/api`

**Swagger UI:** `http://localhost:8080/swagger-ui.html`

### **API Categories**

**1. Authentication:**
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/user
```

**2. Devices:**
```
GET    /api/tenant/devices?pageSize=10&page=0
GET    /api/device/{deviceId}
POST   /api/device
DELETE /api/device/{deviceId}
GET    /api/device/{deviceId}/credentials
POST   /api/device/bulk_import
```

**3. Telemetry:**
```
GET    /api/plugins/telemetry/{entityType}/{entityId}/values/timeseries
GET    /api/plugins/telemetry/{entityType}/{entityId}/values/attributes
POST   /api/plugins/telemetry/{entityId}/timeseries/{scope}
DELETE /api/plugins/telemetry/{entityType}/{entityId}/timeseries/delete
```

**4. Alarms:**
```
GET    /api/alarm/{alarmId}
GET    /api/alarm/{entityType}/{entityId}?pageSize=10&page=0
POST   /api/alarm
PUT    /api/alarm/ack/{alarmId}
PUT    /api/alarm/clear/{alarmId}
```

**5. Rule Chains:**
```
GET    /api/ruleChains?pageSize=10&page=0
GET    /api/ruleChain/{ruleChainId}
POST   /api/ruleChain
GET    /api/ruleChain/{ruleChainId}/metadata
POST   /api/ruleChain/metadata
```

**6. Dashboards:**
```
GET    /api/tenant/dashboards?pageSize=10&page=0
GET    /api/dashboard/{dashboardId}
POST   /api/dashboard
DELETE /api/dashboard/{dashboardId}
```

### **WebSocket API**

**Connection:** `ws://localhost:8080/api/ws`

**Authentication:**
```javascript
const token = 'YOUR_JWT_TOKEN';
const ws = new WebSocket('ws://localhost:8080/api/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    token: token
  }));
};
```

**Subscriptions:**

**Telemetry:**
```javascript
{
  "tsSubCmds": [{
    "entityType": "DEVICE",
    "entityId": "784f394c-42b6-435a-983c-b7beff2784f9",
    "scope": "LATEST_TELEMETRY",
    "cmdId": 1
  }],
  "historyCmds": [],
  "attrSubCmds": []
}
```

**Attributes:**
```javascript
{
  "attrSubCmds": [{
    "entityType": "DEVICE",
    "entityId": "784f394c-42b6-435a-983c-b7beff2784f9",
    "scope": "CLIENT_SCOPE",
    "cmdId": 2
  }]
}
```

---

## 🔨 BUILD & DEPLOYMENT

### **Build Prerequisites**

```bash
# Java 17
java -version

# Maven 3.6+
mvn -version

# Node.js 18+ (for UI)
node -v

# Yarn
yarn -v
```

### **Build Commands**

**Full Build:**
```bash
# Build all modules
mvn clean install -DskipTests

# Result:
# application/target/thingsboard-4.3.0-SNAPSHOT-boot.jar (361 MB)
```

**Build with Tests:**
```bash
mvn clean install
```

**Parallel Build:**
```bash
# Use 2 CPU cores
mvn -T 2C clean install -DskipTests
```

**Build UI Only:**
```bash
cd ui-ngx
yarn install
yarn build:prod
```

### **Installation**

**1. Create Database:**
```bash
psql -U postgres -c "CREATE DATABASE thingsboard;"
```

**2. Install Schema:**
```bash
java -Dspring.datasource.url=jdbc:postgresql://localhost:5432/thingsboard \
     -Dspring.datasource.username=postgres \
     -Dspring.datasource.password=postgres \
     -Dinstall.load_demo=true \
     -jar application/target/thingsboard-4.3.0-SNAPSHOT-boot.jar
```

**3. Start Server:**
```bash
java -jar application/target/thingsboard-4.3.0-SNAPSHOT-boot.jar
```

### **Docker Deployment**

**1. Monolith:**
```bash
cd docker
docker-compose up -d
```

**2. Microservices:**
```bash
cd docker
docker-compose -f docker-compose.postgres.yml \
               -f docker-compose.kafka.yml \
               -f docker-compose.yml up -d
```

**3. Custom Config:**
```bash
# Create .env file
cat > .env <<EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/thingsboard
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
TB_QUEUE_TYPE=kafka
TB_KAFKA_SERVERS=kafka:9092
EOF

docker-compose up -d
```

### **Production Deployment**

**1. Systemd Service:**
```bash
sudo nano /etc/systemd/system/thingsboard.service
```

```ini
[Unit]
Description=ThingsBoard Server
After=network.target postgresql.service

[Service]
Type=simple
User=thingsboard
ExecStart=/usr/bin/java -jar /usr/share/thingsboard/bin/thingsboard.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable thingsboard
sudo systemctl start thingsboard
```

**2. Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name thingsboard.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ws {
        proxy_pass http://localhost:8080/api/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

**3. SSL/TLS:**
```bash
sudo certbot --nginx -d thingsboard.example.com
```

### **Monitoring**

**Prometheus Metrics:**
```yaml
management:
  endpoints:
    web:
      exposure:
        include: "health,info,metrics,prometheus"
  metrics:
    export:
      prometheus:
        enabled: true
```

**Access:** `http://localhost:8080/actuator/prometheus`

**Grafana Dashboards:**
- JVM metrics
- Database connections
- Queue statistics
- Actor system metrics
- API request rates

---

## 🧪 TESTING

### **Unit Tests**

```bash
# Run all unit tests
mvn test

# Run specific test
mvn test -Dtest=DeviceServiceTest
```

### **Integration Tests**

```bash
# Run with Testcontainers
mvn verify
```

**Testcontainers:**
- PostgreSQL
- Kafka
- Redis
- Cassandra

### **Black Box Tests**

```bash
cd msa/black-box-tests
mvn clean install -DskipTests

# Run tests
mvn test -Dtest=DeviceApiTest
```

---

## 📊 PERFORMANCE

### **Benchmarks**

**Hardware:** 4 CPU, 8GB RAM

**Results:**
- **Telemetry Ingestion:** 10,000+ msg/sec per node
- **REST API:** 1,000+ req/sec
- **WebSocket:** 10,000+ concurrent connections
- **Rule Engine:** 5,000+ msg/sec processing
- **Database Writes:** 20,000+ writes/sec (PostgreSQL)

### **Optimization**

**1. Database:**
```sql
-- Connection pool
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

-- Batch inserts
spring.jpa.properties.hibernate.jdbc.batch_size=50
```

**2. Cache:**
```yaml
cache:
  type: redis
  specs:
    devices:
      maxSize: 100000
      timeToLiveInMinutes: 1440
```

**3. Queue:**
```yaml
queue:
  kafka:
    batch-size: 65536
    linger-ms: 10
    buffer-memory: 134217728
```

**4. Actors:**
```yaml
actors:
  tenant:
    max_devices_per_tenant: 10000
  rule:
    thread_pool_size: 50
```

---

## 🐛 DEBUGGING

### **Logging**

**Configuration:** `logback.xml`

```xml
<logger name="org.thingsboard" level="INFO"/>
<logger name="org.thingsboard.server.actors" level="DEBUG"/>
<logger name="org.thingsboard.server.service.telemetry" level="TRACE"/>
```

**Runtime Change:**
```bash
# Via actuator
curl -X POST http://localhost:8080/actuator/loggers/org.thingsboard.server.actors \
  -H 'Content-Type: application/json' \
  -d '{"configuredLevel":"DEBUG"}'
```

### **Remote Debugging**

```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
     -jar thingsboard.jar
```

**IntelliJ IDEA:**
- Run → Edit Configurations → Add Remote JVM Debug
- Host: localhost, Port: 5005

---

## 📚 TROUBLESHOOTING

### **Common Issues**

**1. Database Connection:**
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d thingsboard -c "SELECT 1"
```

**2. Kafka Connection:**
```bash
# Check Kafka running
docker ps | grep kafka

# Test connection
kafka-console-producer.sh --broker-list localhost:9092 --topic test
```

**3. Port Conflicts:**
```bash
# Check port 8080
netstat -tulpn | grep 8080

# Kill process
kill -9 <PID>
```

**4. Out of Memory:**
```bash
# Increase heap size
java -Xms4G -Xmx4G -jar thingsboard.jar
```

**5. Actor Mailbox Overflow:**
```yaml
# Increase mailbox size
actors:
  tenant:
    max_mailbox_size: 10000
```

---

## 📞 RESOURCES

**Official Documentation:**
- Website: https://thingsboard.io
- Docs: https://thingsboard.io/docs
- API: https://thingsboard.io/docs/reference/rest-api
- Community: https://github.com/thingsboard/thingsboard

**Source Code:**
- GitHub: https://github.com/thingsboard/thingsboard
- License: Apache 2.0

**Support:**
- Stack Overflow: https://stackoverflow.com/questions/tagged/thingsboard
- GitHub Issues: https://github.com/thingsboard/thingsboard/issues

---

**Last Updated:** February 26, 2026  
**Version:** 4.3.0-SNAPSHOT  
**Maintained by:** Eitek Development Team
