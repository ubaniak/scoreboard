---
name: bulletproof
description: Bulletproof domain-driven architecture pattern. Use when scaffolding a new domain, organizing backend services, reviewing layering/import boundaries, or when user mentions "bulletproof", "domain layout", "usecase", "gateway", "storage adapter", or asks how to structure a service with entities/storage/gateway/usecase/transport layers.
---

# Bulletproof Architecture

Domain-driven layout. Each domain self-contained. Strict boundaries between layers. Interfaces separate from implementations so adapters swap without touching business logic.

## Layout

```
<domain>/
    entities/
        entities                  # core domain types. no deps on other layers.

    storage                       # interface (port)
    storage/
        mysql                     # impl
        mysql_dto                 # translate entity <-> mysql row
        pg                        # impl
        mongodb                   # impl

    gateway                       # interface (port) for third-party APIs
    gateway/
        api_dto                   # translate entity <-> external API payload
        api                       # impl (e.g. SDK / HTTP client)
        rest_dto
        rest

    usecase | service             # interface + impl. business logic only.

    transport                     # interface (inbound port)
    transport/
        rest_dto                  # translate entity <-> wire format
        rest                      # HTTP handlers
        grpc                      # gRPC handlers

    setup                         # composition root. wires usecase + transport.
```

## Rules

1. **Cross-domain imports**: `DomainA` may import only `entities` and `usecase` of `DomainB`. Never reach into another domain's storage/gateway/transport.
2. **DTOs are translation-only**: convert between public entities and the underlying service shape (DB row, API payload, wire format). No logic.
3. **Usecase = business logic only**. No SQL, no HTTP, no transport concerns. Depends on storage/gateway *interfaces*, never impls.
4. **Single-purpose domains**. If a domain grows two responsibilities, split it or nest a sub-domain.
5. **Storage** persists data. **Gateway** talks to third-party APIs. Do not conflate.
6. **Setup** is the only place that constructs concrete adapters and injects them into usecase + transport.

## Dependency Direction

```
transport  ──►  usecase  ──►  entities
                  │
                  ├──►  storage (interface)  ◄── storage/mysql, pg, mongodb
                  └──►  gateway (interface)  ◄── gateway/api, rest
```

Arrows point inward. Entities depend on nothing. Adapters depend on interfaces, not the other way around.

## When Scaffolding a New Domain

1. Define **entities** first. Pure types, no I/O.
2. Define **storage** + **gateway** interfaces in terms of entities.
3. Write **usecase** interface + impl against those interfaces.
4. Pick adapters (`mysql`, `rest`, etc.) and write impl + DTO per adapter.
5. Define **transport** interface, write `rest`/`grpc` handlers that call usecase.
6. Wire everything in **setup**.

## Review Checklist

- [ ] Entities import nothing from sibling layers
- [ ] Usecase has zero imports from `storage/<impl>`, `gateway/<impl>`, or `transport/<impl>`
- [ ] DTO files contain only mapping code
- [ ] Cross-domain imports limited to `entities` and `usecase` of the other domain
- [ ] `setup` is the only file that names concrete adapters
- [ ] Each domain has one purpose; nested sub-domains used when needed

## Anti-Patterns

- Usecase importing `mysql` package directly → leak. Depend on storage interface.
- Transport calling storage directly → bypass business logic.
- Entity referencing a DTO → backwards dependency.
- Domain A's transport importing Domain B's storage → boundary violation.
- DTO doing validation or business decisions → belongs in usecase.
