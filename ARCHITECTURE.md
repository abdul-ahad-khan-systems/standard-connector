# Standard Connector V1 — Frozen Architecture

This document defines the **frozen** architecture of Standard Connector V1.
Any change that violates the invariants defined here requires **V2**.

---

## 0. Implementation Language

Foundation is implemented **JavaScript-first**. TypeScript migration is
explicitly **deferred** to a later hardening phase and is NOT a current
Foundation requirement. Do not treat the absence of a `tsconfig.json`
or `.ts` sources as a Foundation gap. When TypeScript migration happens,
it is a deliberate, project-wide change — not mixed into unrelated
compatibility/resolution work.

---

## 1. Mission

Standard Connector V1 is a **reusable, host-agnostic, application-agnostic,
vendor-agnostic, deterministic, bounded, externally extensible** connector
framework.

It exists to mediate between a **requester** and an **external capability**
through a normalized, versioned, compatibility-checked contract.

---

## 2. Core Invariants (Frozen)

The Core MUST remain:

- reusable
- host-agnostic
- application-agnostic
- vendor-agnostic
- deterministic
- bounded
- externally extensible

### Core OWNS

- protocol/version definition
- request contract
- result contract
- normalized error contract
- `InterfaceDescriptor`
- compatibility checking
- compatibility classification
- compatibility resolution
- gateway / dispatch
- policy hooks
- authentication / scope interfaces
- lifecycle contract
- plugin contract
- version compatibility
- deterministic failure / rejection

### Core MUST NOT contain

- VÆLOR
- DevMesh
- Kali
- robotics
- specific security products
- specific hosts
- specific vendors
- application-specific business logic
- mission planning
- autonomous reasoning
- long-term memory
- host-specific tools
- host-specific protocols
- host-specific credentials

**Breaking Core changes require V2.**

---

## 3. External Surfaces

All of the following are **external** to Core:

| Surface | Location | Purpose |
|---|---|---|
| Plugins | `./src/plugins` | Extend Core capabilities |
| Adapters | `./src/adapters` | Translate between interfaces |
| Sub-connectors | `./src/subconnectors` | Bridge connection/transport/protocol |
| Connector resolution | `./src/subconnectors` (generic) | Discover compatible Standard Connector implementations |
| Host adapters | `./src/hosts` | Adapt specific hosts (e.g. VÆLOR, DevMesh) into the Standard Connector contract |

Core MUST NOT hardcode any specific plugin, adapter, sub-connector,
connector implementation, or host.

---

## 4. Canonical Flow

```
REQUEST
  → COMPATIBILITY CHECK
  → CLASSIFY
  → RESOLVE
  → RECHECK
  → CONNECT OR REJECT
```

The ONLY required classifications are:

1. **DIRECT_MATCH** — connect directly.
2. **ADAPTER_REQUIRED** — external compatible adapter discovery
   → deterministic selection
   → translation / adaptation
   → compatibility recheck
   → connect or reject.
3. **SUB_CONNECTOR_REQUIRED** — external compatible sub-connector discovery
   → deterministic selection
   → bridge connection / transport / protocol mechanism
   → preserve Standard Connector contract
   → compatibility recheck
   → connect or reject.
4. **CONNECTOR_MISMATCH** — external generic connector-resolution mechanism
   → discover compatible Standard Connector implementation / version
   → deterministic selection
   → compatibility recheck
   → connect or reject.
5. **INCOMPATIBLE** — reject.

Rules:

- Never coerce.
- Never silently downgrade.
- Never pretend compatibility exists.

---

## 5. Resolution Safety

Resolution MUST be:

- deterministic
- bounded
- cycle-safe

Required mechanisms:

- maximum resolution depth
- resolution-step tracking
- visited-state tracking
- cycle detection
- deterministic candidate selection
- deterministic rejection

Reject on:

- depth exceeded
- cycle detected
- repeated state
- no candidate
- incompatible transformation
- adapter failure
- sub-connector failure
- connector-resolution failure
- compatibility recheck failure

Every transformation MUST trigger a fresh compatibility check.
No uncontrolled recursive chains.

---

## 6. Lifecycle Contract

Standard Connector V1 defines the following lifecycle states:

```
REGISTERED → INITIALIZED → STARTED → ACTIVE → STOPPED → UNLOADED
```

Plus terminal failure states:

- `FAILED` (lifecycle failure)
- `REJECTED` (compatibility / resolution failure)

Invalid transitions are rejected deterministically.

---

## 7. Versioning

- Standard Connector V1 uses **semantic versioning** (`MAJOR.MINOR.PATCH`).
- Core protocol version is part of the `InterfaceDescriptor`.
- Compatibility is checked against the **MAJOR** version.
- Incompatible MAJOR versions are rejected.
- Unsupported protocol versions are rejected.
- Invalid versions are rejected.

V1 breaking boundary: any change that alters Core invariants, contracts,
classifications, or resolution semantics requires **V2**.

---

## 8. Contracts

### 8.1 Request Contract

A request is a normalized, validated object describing:

- target interface (`InterfaceDescriptor`)
- operation
- parameters
- authentication / scope references
- caller identity (opaque to Core)

### 8.2 Result Contract

A result is a normalized object describing:

- status (`OK` | `ERROR`)
- payload (opaque to Core)
- metadata (deterministic, bounded)

### 8.3 Normalized Error Contract

All errors are normalized to:

- `code` — stable, deterministic
- `category` — one of:
  - `COMPATIBILITY`
  - `ADAPTER`
  - `SUB_CONNECTOR`
  - `LIFECYCLE`
  - `VERSION`
  - `VALIDATION`
  - `RESOLUTION`
  - `UNEXPECTED`
- `message` — human-readable
- `cause` — optional structured cause
- `recoverable` — boolean

Core MUST NOT leak host-, vendor-, or application-specific error shapes.

---

## 9. V1 Boundary

V1 is **frozen** at the Core boundary. The following are explicitly
**out of scope** for V1:

- autonomous reasoning
- long-term memory
- mission planning
- host-specific tools
- host-specific protocols
- host-specific credentials
- vendor lock-in
- application-specific business logic

Any of the above requires V2 or an external extension.

---

## 10. Extensibility Principle

> An extension can be added without modifying Core.

This is a **hard architectural invariant**. It is verified by executable
tests in `./tests/integrity` and `./tests/integration`.

---

End of Standard Connector V1 Architecture.
