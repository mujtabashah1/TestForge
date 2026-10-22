# M11 Docker Verification

Verification date: 2026-10-23 (Asia/Karachi)

Overall status: **Blocked**

The repository's Compose model is statically valid, but the local Docker daemon cannot stay running because Docker Desktop's WSL integration fails. Image builds, live service health, database persistence, restart recovery, and container-targeted tests are therefore not verified.

## Environment

| Item                    | Observed result                               | Status             |
| ----------------------- | --------------------------------------------- | ------------------ |
| Host                    | Windows 10 Pro, build 19045, 64-bit           | Verified           |
| Docker Desktop          | 4.96.3, per-user installation                 | Verified installed |
| Docker Engine client    | 29.9.2                                        | Verified installed |
| Docker Compose          | 5.6.1                                         | Verified installed |
| WSL                     | 2.6.2.0; kernel 6.6.87.2-1; default version 2 | Verified installed |
| Docker WSL distribution | `docker-desktop`, WSL version 2               | Verified present   |
| Docker daemon           | Named pipe unavailable after backend failure  | Blocked            |

Docker binaries are installed under `C:\Users\PERSONAL\AppData\Local\Programs\DockerDesktop`, but that directory is not on this shell's `PATH`. Verification used the absolute `docker.exe` path.

## Commands and evidence

### Client and static configuration

```powershell
& 'C:\Users\PERSONAL\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe' --version
& 'C:\Users\PERSONAL\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe' compose version
& 'C:\Users\PERSONAL\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe' compose config --quiet
```

Observed:

- `Docker version 29.9.2, build a82e528`
- `Docker Compose version v5.6.1`
- Compose configuration parsed successfully.

Static inspection confirms:

- PostgreSQL 17 Alpine with a named persistent volume.
- An initialization script creates the dedicated `testforge_test` database.
- Backend waits for PostgreSQL health and runs `prisma migrate deploy` plus the idempotent seed before starting.
- Frontend waits for backend health.
- PostgreSQL, backend, and frontend have explicit health checks after the M11 Compose correction.
- Host ports are 5432, 4000, and 3000; service-to-service database traffic uses the internal `postgres` hostname.

### Daemon startup attempts

Docker Desktop was started from its installed executable. The first attempt failed while creating the Docker WSL instance:

```text
Wsl/Service/CreateInstance/0x80072746
An existing connection was forcibly closed by the remote host.
```

A controlled `wsl --shutdown` followed by this probe succeeded once:

```powershell
wsl -d docker-desktop -e /bin/true
```

Docker Desktop was then restarted. Its backend again terminated, this time while starting the socket-forwarding bridge:

```text
Wsl/0x800706bf
The remote procedure call failed and did not execute.
Command: -d docker-desktop -e /usr/bin/vpnkit-bridge ...
```

After the failure, an elevated Docker version request reported that `//./pipe/dockerDesktopLinuxEngine` did not exist. One preceding Docker CLI request also crashed with `fatal error: runtime: cannot allocate memory`; at that time the host reported approximately 4.7 GB free physical memory and 1.8 GB free virtual memory. This memory observation is diagnostic context, not a proven root cause.

## Verification matrix

| Requirement                             | Result         | Evidence or blocker                                            |
| --------------------------------------- | -------------- | -------------------------------------------------------------- |
| Compose syntax/rendering                | **Verified**   | `docker compose config --quiet` exited 0                       |
| Images build                            | **Not tested** | Daemon unavailable                                             |
| Services start                          | **Blocked**    | Docker Desktop backend exits on WSL RPC failure                |
| PostgreSQL health                       | **Not tested** | No running container                                           |
| Backend health                          | **Not tested** | No running container                                           |
| Frontend health                         | **Not tested** | No running container; health check added and statically parsed |
| Migrations and seed in containers       | **Not tested** | No running backend/database containers                         |
| Frontend/API connectivity               | **Not tested** | No running services                                            |
| Smoke/integration tests against Compose | **Not tested** | No running services                                            |
| PostgreSQL persistence across restart   | **Not tested** | No running volume/service                                      |
| Backend/frontend restart recovery       | **Not tested** | No running services                                            |
| Unhealthy-service detection             | **Not tested** | Health checks configured but not executed                      |
| Cleanup behavior                        | **Not tested** | No project containers or volumes were created                  |

No volumes, containers, images, or user data were deleted during diagnosis.

## Required host remediation

The remaining work is outside repository code:

1. Reboot Windows to reset the WSL/virtualization RPC services.
2. Start Docker Desktop interactively and confirm its engine reaches the Running state.
3. If the WSL RPC failure persists, run Docker Desktop's supported diagnostics/repair workflow and verify Windows Subsystem for Linux and Virtual Machine Platform are enabled. Administrative rights may be required.
4. Re-run the runtime matrix above. Do not mark M11.1 complete until builds, health checks, persistence, restart recovery, and container-targeted tests execute successfully.

The repository must not use a Docker factory reset or unregister `docker-desktop` without explicit approval because those actions can destroy Docker-managed data.
