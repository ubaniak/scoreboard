# backend-style

You are helping the user add or modify Go backend code in the scoreboard project. When invoked, apply the patterns below exactly as described. Read relevant existing files before writing anything new.

---

## Domain layout

Every domain lives under `internal/<domain>/` and follows this exact three-file structure:

```
internal/<domain>/
  app.go          ← HTTP handlers + route registration
  usecase.go      ← business logic (UseCase interface + usecase struct)
  storage.go      ← Storage interface + NewSqlite constructor shim
  entities/
    entities.go   ← plain Go structs, no GORM tags
  storage/
    <domain>.go   ← GORM model struct
    sqlite.go     ← Sqlite struct, ToGormModel, ToEntity, CRUD methods
```

---

## Patterns to follow

### `storage.go` — interface shim
The package-level `Storage` interface and a thin `NewSqlite` wrapper that delegates to the concrete type:

```go
type Storage interface {
    Save(…) (uint, error)
    List(…) ([]*entities.Foo, error)
    Get(…) (*entities.Foo, error)
    Delete(…) error
    Update(…) error
}

func NewSqlite(db *gorm.DB) (Storage, error) {
    return storage.NewSqlite(db)
}
```

### `storage/<domain>.go` — GORM model
Plain GORM struct with `gorm.Model` embedded. No business logic.

```go
type Foo struct {
    gorm.Model
    Name   string `gorm:"not null"`
    Status string `gorm:"not null"`
}
```

### `storage/sqlite.go` — Sqlite implementation
- `NewSqlite` runs `db.AutoMigrate` and returns `(*Sqlite, error)`
- `ToGormModel` and `ToEntity` are value-receiver methods that convert between entity and GORM model
- Each CRUD method is a pointer-receiver on `*Sqlite`

```go
type Sqlite struct { db *gorm.DB }

func NewSqlite(db *gorm.DB) (*Sqlite, error) {
    if err := db.AutoMigrate(&Foo{}); err != nil {
        return nil, err
    }
    return &Sqlite{db: db}, nil
}

func (*Sqlite) ToGormModel(e *entities.Foo) *Foo { … }
func (*Sqlite) ToEntity(m Foo) *entities.Foo     { … }
```

### `usecase.go` — business logic
- Export a `UseCase` interface listing every operation
- Unexported `useCase` struct implements it
- `NewUseCase` returns the interface, not the struct
- Dependencies are injected as interfaces (never concrete types)

```go
type UseCase interface {
    Create(…) error
    Get(id uint) (*entities.Foo, error)
}

type useCase struct {
    storage Storage
}

func NewUseCase(storage Storage) UseCase {
    return &useCase{storage: storage}
}
```

### `app.go` — HTTP layer
- `App` struct holds a `UseCase` and any cross-domain interfaces (narrow interfaces, not full packages)
- Cross-domain deps use narrow local interfaces to avoid circular imports:
  ```go
  type CardQuerier interface {
      GetNumberOfJudges(cardId uint) (int, error)
  }
  ```
- `RegisterRoutes` registers every route on the passed-in `*rbac.RouteBuilder`
- Each handler writes responses via `presenters.NewHTTPPresenter[T]`:
  ```go
  func (a *App) Get(w http.ResponseWriter, r *http.Request) {
      id, err := muxutils.ParseIntVar(r, "id")
      …
      result, err := a.useCase.Get(uint(id))
      presenters.NewHTTPPresenter[*entities.Foo](r, w).
          WithData(result).
          WithError(err).
          Present()
  }
  ```
- Routes use `rbac.Admin` or a judge role constant from `internal/rbac/roles.go`

### `entities/entities.go` — plain structs
No GORM tags. No JSON tags on internal domain entities (those go on the DTO/response structs in `app.go`).

### Registering a new domain in `cmd/main.go`
1. Init storage: `fooStorage, err := foo.NewSqlite(db)`
2. Init use case: `fooUseCase := foo.NewUseCase(fooStorage)`
3. Init app: `fooApp := foo.NewApp(fooUseCase)`
4. Register: `register.Add(fooApp)` under the appropriate subrouter

---

## Naming conventions

| Thing | Convention |
|---|---|
| GORM model | `Foo` (same as entity, lives in `storage/` package) |
| Entity | `Foo` (lives in `entities/` package) |
| Interface | `UseCase`, `Storage` (not `IFoo`) |
| Constructor | `NewFoo`, `NewUseCase`, `NewSqlite` |
| HTTP handler method | PascalCase verb: `Create`, `List`, `Get`, `Update`, `Delete` |
| Route label | `"<domain>.<action>"` e.g. `"bouts.create"` |

---

## What NOT to do

- Do not put JSON tags on entities — put them on response structs in `app.go`
- Do not import a sibling domain package directly — use a narrow interface
- Do not return concrete structs from `NewUseCase` or `NewSqlite` at the package boundary — always return the interface
- Do not add error handling for impossible cases inside the same process
- Do not add middleware inside `app.go` — middleware belongs in `cmd/main.go` or `rbac`
