# Render deployment

This project is configured to deploy as one Render Web Service:

- Express serves the API under `/api`.
- Angular builds to `client/dist/frontend-app/browser`.
- Express serves the Angular production build for all non-API routes.

## Deploy with Blueprint

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select the repository.
4. When Render prompts for environment variables, set:

```text
MONGO_URI=<your MongoDB Atlas connection string>
RESEND_API_KEY=<your Resend API key>
RESEND_FROM_EMAIL=Nyvra <onboarding@resend.dev>
```

`JWT_SECRET` is generated automatically by `render.yaml`.

## Manual Web Service settings

If you do not use the Blueprint flow, create a Render Web Service with:

```text
Runtime: Node
Build Command: npm run build
Start Command: npm start
Health Check Path: /api/health
```

Then add these environment variables:

```text
NODE_VERSION=22.22.0
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random secret>
RESEND_API_KEY=<your Resend API key>
RESEND_FROM_EMAIL=Nyvra <onboarding@resend.dev>
```

## Seed products and create admin

After the first deploy, use the Render Shell or a one-off job:

```sh
npm run seed
```

To create or update the admin user, first add these service environment variables:

```text
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<your strong admin password>
```

Then run:

```sh
npm run create-admin
```
