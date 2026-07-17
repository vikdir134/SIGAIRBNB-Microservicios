param(
  [switch]$Reset
)

$ErrorActionPreference = "Stop"

$NAMESPACE = "staype"

Write-Host "====================================="
Write-Host " DEPLOY KUBERNETES - STAYPE"
Write-Host "====================================="

function Wait-NamespaceDeleted {
  param(
    [string]$Name
  )

  while ($true) {
    $result = kubectl get namespace $Name --ignore-not-found 2>$null

    if ([string]::IsNullOrWhiteSpace($result)) {
      break
    }

    Write-Host "Esperando eliminacion del namespace $Name..."
    Start-Sleep -Seconds 3
  }
}

function Create-SecretFromEnvOrEmpty {
  param(
    [string]$SecretName,
    [string]$EnvPath
  )

  if (Test-Path $EnvPath) {
    Write-Host "Creando Secret $SecretName desde $EnvPath..."
    kubectl create secret generic $SecretName --from-env-file=$EnvPath -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
  } else {
    Write-Host "ADVERTENCIA: No existe $EnvPath. Se creara Secret vacio: $SecretName"
    kubectl create secret generic $SecretName -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
  }
}

function Start-PortForward {
  param(
    [string]$Name,
    [string]$Service,
    [int]$LocalPort,
    [int]$TargetPort
  )

  $portInUse = Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue

  if ($portInUse) {
    Write-Host "Puerto $LocalPort ya esta en uso. No se abrira otro port-forward para $Name."
  } else {
    Write-Host "Abriendo $Name en localhost:$LocalPort..."

    Start-Process powershell.exe -ArgumentList @(
      "-NoExit",
      "-Command",
      "kubectl port-forward -n $NAMESPACE svc/$Service ${LocalPort}:${TargetPort}"
    )

    Start-Sleep -Seconds 2
  }
}

Write-Host "`n[1/12] Verificando Docker..."
docker ps | Out-Null

Write-Host "`n[2/12] Verificando Kubernetes..."
kubectl get nodes

if ($Reset) {
  Write-Host "`n[RESET] Eliminando namespace anterior..."
  kubectl delete namespace $NAMESPACE --ignore-not-found
  Wait-NamespaceDeleted -Name $NAMESPACE
}

Write-Host "`n[3/12] Construyendo imagenes Docker..."
docker compose build

Write-Host "`n[4/12] Creando namespace..."
kubectl apply -f .\k8s\namespace.yaml

Write-Host "`n[5/12] Creando ConfigMaps..."
kubectl create configmap booking-mysql-initdb --from-file=.\database\mysql\booking -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap finance-postgres-initdb --from-file=.\database\postgres\finance -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap catalog-sql-initdb --from-file=.\database\sqlserver\catalog -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap catalog-init-script --from-file=.\database\sqlserver\init -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
kubectl create configmap config-repo --from-file=.\config-repo -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

Write-Host "`n[6/12] Creando Secrets desde archivos .env..."
Create-SecretFromEnvOrEmpty -SecretName "auth-env" -EnvPath ".\auth-service\.env"
Create-SecretFromEnvOrEmpty -SecretName "catalog-env" -EnvPath ".\catalog-service\.env"
Create-SecretFromEnvOrEmpty -SecretName "booking-env" -EnvPath ".\booking-service\.env"
Create-SecretFromEnvOrEmpty -SecretName "finance-env" -EnvPath ".\finance-service\.env"

Write-Host "`n[7/12] Levantando bases de datos..."
kubectl apply -f .\k8s\booking-mysql.yaml
kubectl apply -f .\k8s\finance-postgres.yaml
kubectl apply -f .\k8s\sqlserver.yaml

Write-Host "`nEsperando bases de datos..."
kubectl rollout status deployment/booking-mysql -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/finance-postgres -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/sqlserver -n $NAMESPACE --timeout=180s

Write-Host "`n[8/12] Inicializando Catalog en SQL Server..."
kubectl delete job sqlserver-init -n $NAMESPACE --ignore-not-found
kubectl apply -f .\k8s\sqlserver-init.yaml
kubectl wait --for=condition=complete job/sqlserver-init -n $NAMESPACE --timeout=300s
kubectl logs -n $NAMESPACE job/sqlserver-init

Write-Host "`n[9/12] Levantando Config Service y Registry..."
kubectl apply -f .\k8s\config-service.yaml
kubectl apply -f .\k8s\registry-service.yaml

kubectl rollout status deployment/config-service -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/registry-service -n $NAMESPACE --timeout=180s

Write-Host "`n[10/12] Levantando microservicios y API Gateway..."
kubectl apply -f .\k8s\auth-service.yaml
kubectl apply -f .\k8s\booking-service.yaml
kubectl apply -f .\k8s\catalog-service.yaml
kubectl apply -f .\k8s\finance-service.yaml
kubectl apply -f .\k8s\api-gateway.yaml

kubectl rollout status deployment/auth-service -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/booking-service -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/catalog-service -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/finance-service -n $NAMESPACE --timeout=180s
kubectl rollout status deployment/api-gateway -n $NAMESPACE --timeout=180s

Write-Host "`n[11/12] Levantando frontend..."
kubectl apply -f .\k8s\frontend.yaml
kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=180s

Write-Host "`n[12/12] Estado final del despliegue..."
kubectl get pods -n $NAMESPACE
kubectl get svc -n $NAMESPACE

Write-Host "`n[EXTRA] Abriendo accesos locales con port-forward..."

Start-PortForward -Name "Frontend" -Service "frontend" -LocalPort 15173 -TargetPort 80
Start-PortForward -Name "API Gateway" -Service "api-gateway" -LocalPort 18080 -TargetPort 8080
Start-PortForward -Name "Registry" -Service "registry-service" -LocalPort 18761 -TargetPort 8761

Write-Host "`nEsperando que los port-forward levanten..."
Start-Sleep -Seconds 5

Write-Host "`nAbriendo frontend en el navegador..."
Start-Process "http://localhost:15173"

Write-Host "`n====================================="
Write-Host " APLICACION LISTA"
Write-Host "====================================="
Write-Host "Frontend:     http://localhost:15173"
Write-Host "API Gateway:  http://localhost:18080"
Write-Host "Registry:     http://localhost:18761/services"
Write-Host ""
Write-Host "Importante: no cierres las ventanas de PowerShell que se abrieron con port-forward."