# AKS/EKS target-application deployment

These manifests describe the application CloudOpt evaluates. They are generic
Kubernetes resources and work on AKS or EKS.

The service is intentionally `ClusterIP`: k6 and the experiment runner should
run inside the cluster. Do not expose the bounded compute endpoint publicly just
to make the Vercel dashboard call it.

## Build and push the image

From the repository root, choose your ACR, ECR, or other registry image name:

```bash
docker build -t REGISTRY/cloudopt-target:VERSION target-app
docker push REGISTRY/cloudopt-target:VERSION
```

Use an immutable version or digest for experiments. Replace
`CLOUDOPT_TARGET_IMAGE` in `target-app.yaml` before applying it.

## Deploy

```bash
kubectl apply -f deploy/kubernetes/namespace.yaml
kubectl apply -f deploy/kubernetes/target-app.yaml
kubectl -n cloudopt-lab rollout status deployment/cloudopt-target
kubectl -n cloudopt-lab get pods,service
```

Inside the cluster, the target URL is:

```text
http://cloudopt-target.cloudopt-lab.svc.cluster.local
```

## Resource profiles

The runner should patch only allowlisted values and wait for rollout readiness
between runs. The existing measured profiles map to:

| Label | CPU limit | Memory limit |
| --- | ---: | ---: |
| `cpu_0.25_mem_128` | `250m` | `128Mi` |
| `cpu_1_mem_512` | `1` | `512Mi` |

The existing `unconstrained` measurement is useful as historical evidence but
should be replaced by a finite static baseline for repeatable cluster tests.

## Next runner components

- A namespace-scoped service account that can read pods and patch only the
  `cloudopt-target` Deployment.
- A k6 Job image containing the versioned workload scripts.
- Prometheus query access for CPU, memory, latency, failures, and throughput.
- Persistent experiment metadata and raw result storage.
- An authenticated job API or queue consumed by the runner.
- Guaranteed rollback/cleanup after success, failure, cancellation, or timeout.

Do not give the public Vercel function a kubeconfig. It should submit an
authenticated request to the runner and read persisted status/results.
