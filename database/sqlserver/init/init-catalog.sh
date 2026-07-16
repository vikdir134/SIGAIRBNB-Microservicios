#!/usr/bin/env bash
set -e

SQLCMD="/opt/mssql-tools18/bin/sqlcmd"

if [ ! -x "$SQLCMD" ]; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

echo "Esperando a SQL Server..."

until "$SQLCMD" -S sqlserver -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1
do
  echo "SQL Server aun no esta listo. Esperando 5 segundos..."
  sleep 5
done

echo "SQL Server listo."

CATALOG_EXISTS=$("$SQLCMD" -S sqlserver -U sa -P "$SA_PASSWORD" -C -h -1 -W -Q "SET NOCOUNT ON; IF DB_ID(N'staype_catalog_db') IS NULL SELECT 0 ELSE SELECT 1;")

if [ "$CATALOG_EXISTS" = "1" ]; then
  echo "La base staype_catalog_db ya existe. Se omite la inicializacion de catalog."
  exit 0
fi

echo "Ejecutando DDL de catalog..."
"$SQLCMD" -S sqlserver -U sa -P "$SA_PASSWORD" -C -i /init/catalog/01_catalog_ddl.sql

echo "Ejecutando data de catalog..."
"$SQLCMD" -S sqlserver -U sa -P "$SA_PASSWORD" -C -d staype_catalog_db -i /init/catalog/02_catalog_data.sql

echo "Catalog inicializado correctamente."