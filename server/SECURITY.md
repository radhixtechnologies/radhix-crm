# Production security configuration

- Set `JWT_SECRET` to a private random value of at least 32 bytes in the deployment environment. Production startup fails if it is missing, uses the development default, or is shorter than 32 bytes.
- Authentication endpoints apply per-IP limits: 10 login attempts per 15 minutes and 5 password recovery/reset requests per hour.
- Helmet sets standard HTTP security headers. The server trusts one reverse proxy hop for client IP extraction; verify this matches the production hosting topology before exposing the API.
- The current rate-limit store is process-local. Multi-instance deployments must configure a shared rate-limit store before relying on limits across replicas.
- These protections are not a substitute for tenant isolation, per-tenant authorization, backups, monitoring, billing controls, or a production security review. The application should not be marketed as a multi-tenant SaaS until those are implemented and tested.
