---
name: app-engine-deploy
description: "App Engine: app.yaml, scaling, IAM."
license: Apache-2.0
compatibility: opencode
---

# App Engine Deployment

## app.yaml (Python 3.11)

```yaml
runtime: python311
service: my-service
env: standard

instance_class: F2  # or B2 for basic
automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.65
  target_throughput_utilization: 0.9

handlers:
- url: /static
  static_dir: static
- url: /.*
  script: auto
```

## Scaling

- **Automatic** (default): scales with traffic. Cold starts on scale-up.
- **Basic**: runs 24/7, scales based on CPU/requests.
- **Manual**: fixed instance count. Use for steady traffic.
- `min_idle_instances: 1` reduces cold starts.

## Services & Routing

- Multiple `.yaml` files = multiple services: `gcloud app deploy service1.yaml`.
- `dispatch.yaml` for URL routing:
```yaml
dispatch:
- url: "*/api/*"
  service: api
- url: "*/static/*"
  service: static
```
- `gcloud app browse` — opens default service in browser.

## IAM & Authentication

- `gcloud app deploy -v v1.2 --no-promote` — staging deployment.
- IAM roles: `roles/appengine.appViewer`, `roles/storage.objectViewer`.
- `gcloud projects add-iam-policy-binding PROJECT --member="user:email" --role="roles/appengine.deployer"`.

## Environment Variables & Secrets

```yaml
env_variables:
  DEBUG: "0"
  SECRET_KEY: "secret"
```
- **Never commit secrets to app.yaml.** Use Secret Manager:
```yaml
env: flex
beta_settings:
  secrets:
  - name: "projects/PROJECT/secrets/SECRET_NAME"
    version: "latest"
    env: "SECRET_KEY"
```

## Cloud SQL

- `gcloud app deploy -Y --no-promote` then:
```python
import google.cloud.sql.connector
connector = google.cloud.sql.connector.Connector()
```
- Or Unix socket: `/cloudsql/CONNECTION_NAME/.s.PGSQL.5432`.
- Connection name from console: `gcloud sql instances describe INSTANCE`.

## Deployment Commands

```bash
# Deploy with service account
gcloud app deploy --service-account=SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com

# Rollback
gcloud app versions stop VERSION_ID

# View logs
gcloud app logs tail -s my-service

# CI/CD with Cloud Build
# cloudbuild.yaml:
steps:
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  args: ['gcloud', 'app', 'deploy']
```
