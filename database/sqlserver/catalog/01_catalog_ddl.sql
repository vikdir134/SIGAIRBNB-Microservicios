/*
  SIGAIRBNB / Stay.pe
  Script limpio para la base independiente del catalog-service.

  Base destino sugerida:
  - staype_catalog_db

  Esta versión conserva únicamente objetos del dominio catalog.
  Se eliminaron las llaves foráneas externas hacia:
  - core.Empresa
  - auth.Usuario

  Esos campos se mantienen como referencias lógicas:
  - catalog.Inmueble.empresa_id
  - catalog.Publicacion.publicado_por_usuario_id
*/

IF DB_ID(N'staype_catalog_db') IS NULL
BEGIN
    CREATE DATABASE [staype_catalog_db];
END
GO

USE [staype_catalog_db];
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'catalog')
BEGIN
    EXEC('CREATE SCHEMA [catalog]');
END
GO

/****** Object:  Table [catalog].[Inmueble]    Script Date: 12/07/2026 15:18:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [catalog].[Inmueble](
	[inmueble_id] [int] IDENTITY(1,1) NOT NULL,
	[empresa_id] [int] NOT NULL,
	[edificio_id] [int] NULL,
	[codigo] [nvarchar](30) NOT NULL,
	[tipo_inmueble] [nvarchar](20) NOT NULL,
	[nombre] [nvarchar](150) NOT NULL,
	[subtipo_unidad] [nvarchar](50) NULL,
	[descripcion] [nvarchar](1000) NULL,
	[direccion_linea1] [nvarchar](255) NOT NULL,
	[direccion_linea2] [nvarchar](255) NULL,
	[numero] [nvarchar](30) NULL,
	[distrito] [nvarchar](100) NULL,
	[ciudad] [nvarchar](100) NULL,
	[provincia] [nvarchar](100) NULL,
	[departamento] [nvarchar](100) NULL,
	[codigo_postal] [nvarchar](20) NULL,
	[pais] [nvarchar](100) NOT NULL,
	[planta] [nvarchar](20) NULL,
	[letra] [nvarchar](20) NULL,
	[area_m2] [decimal](10, 2) NULL,
	[num_habitaciones] [int] NULL,
	[num_banos] [int] NULL,
	[capacidad_personas] [int] NULL,
	[renta_base_mensual] [decimal](12, 2) NULL,
	[moneda] [char](3) NOT NULL,
	[latitud] [decimal](9, 6) NULL,
	[longitud] [decimal](9, 6) NULL,
	[estado_operativo] [nvarchar](20) NOT NULL,
	[es_publicable] [bit] NOT NULL,
	[activo] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[deleted_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[inmueble_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Inmueble_Codigo] UNIQUE NONCLUSTERED 
(
	[codigo] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [catalog].[Publicacion]    Script Date: 12/07/2026 15:18:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [catalog].[Publicacion](
	[publicacion_id] [int] IDENTITY(1,1) NOT NULL,
	[inmueble_id] [int] NOT NULL,
	[titulo] [nvarchar](200) NOT NULL,
	[descripcion_corta] [nvarchar](500) NULL,
	[descripcion_larga] [nvarchar](max) NULL,
	[precio_publicado_mensual] [decimal](12, 2) NOT NULL,
	[moneda] [char](3) NOT NULL,
	[condiciones_arrendamiento] [nvarchar](1000) NULL,
	[disponible_desde] [date] NULL,
	[estado_publicacion] [nvarchar](20) NOT NULL,
	[es_destacado] [bit] NOT NULL,
	[acepta_reservas] [bit] NOT NULL,
	[fecha_publicacion] [datetime2](7) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[publicado_por_usuario_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[publicacion_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Publicacion_Inmueble] UNIQUE NONCLUSTERED 
(
	[inmueble_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

/****** Object:  Table [catalog].[InmuebleFoto]    Script Date: 12/07/2026 15:18:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [catalog].[InmuebleFoto](
	[inmueble_foto_id] [int] IDENTITY(1,1) NOT NULL,
	[publicacion_id] [int] NOT NULL,
	[url_foto] [nvarchar](500) NOT NULL,
	[nombre_archivo] [nvarchar](255) NULL,
	[orden_visual] [int] NOT NULL,
	[es_principal] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[public_id_cloudinary] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[inmueble_foto_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [catalog].[BloqueoDisponibilidad]    Script Date: 12/07/2026 15:18:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [catalog].[BloqueoDisponibilidad](
	[bloqueo_disponibilidad_id] [int] IDENTITY(1,1) NOT NULL,
	[inmueble_id] [int] NOT NULL,
	[fecha_inicio] [date] NOT NULL,
	[fecha_fin] [date] NOT NULL,
	[motivo] [nvarchar](300) NULL,
	[origen] [nvarchar](20) NOT NULL,
	[activo] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[bloqueo_padre_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[bloqueo_disponibilidad_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [catalog].[Caracteristica]    Script Date: 12/07/2026 15:18:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [catalog].[Caracteristica](
	[caracteristica_id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[tipo_dato] [nvarchar](20) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[activo] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[caracteristica_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_Caracteristica_Nombre] UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

/****** Object:  Table [catalog].[InmuebleCaracteristica]    Script Date: 12/07/2026 15:18:53 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [catalog].[InmuebleCaracteristica](
	[inmueble_caracteristica_id] [int] IDENTITY(1,1) NOT NULL,
	[inmueble_id] [int] NOT NULL,
	[caracteristica_id] [int] NOT NULL,
	[valor_texto] [nvarchar](200) NULL,
	[valor_numero] [decimal](12, 2) NULL,
	[valor_boolean] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[inmueble_caracteristica_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [UQ_InmuebleCaracteristica] UNIQUE NONCLUSTERED 
(
	[inmueble_id] ASC,
	[caracteristica_id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


/* Defaults, foreign keys internas y checks del dominio catalog */

ALTER TABLE [catalog].[BloqueoDisponibilidad] ADD  DEFAULT ('MANUAL') FOR [origen]
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad] ADD  DEFAULT ((1)) FOR [activo]
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO

ALTER TABLE [catalog].[Caracteristica] ADD  DEFAULT ('BOOLEAN') FOR [tipo_dato]
GO

ALTER TABLE [catalog].[Caracteristica] ADD  DEFAULT ((1)) FOR [activo]
GO

ALTER TABLE [catalog].[Caracteristica] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO

ALTER TABLE [catalog].[Inmueble] ADD  DEFAULT (N'Perú') FOR [pais]
GO

ALTER TABLE [catalog].[Inmueble] ADD  DEFAULT ('PEN') FOR [moneda]
GO

ALTER TABLE [catalog].[Inmueble] ADD  DEFAULT ('DISPONIBLE') FOR [estado_operativo]
GO

ALTER TABLE [catalog].[Inmueble] ADD  DEFAULT ((1)) FOR [es_publicable]
GO

ALTER TABLE [catalog].[Inmueble] ADD  DEFAULT ((1)) FOR [activo]
GO

ALTER TABLE [catalog].[Inmueble] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO

ALTER TABLE [catalog].[Inmueble] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO

ALTER TABLE [catalog].[InmuebleCaracteristica] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO

ALTER TABLE [catalog].[InmuebleFoto] ADD  DEFAULT ((1)) FOR [orden_visual]
GO

ALTER TABLE [catalog].[InmuebleFoto] ADD  DEFAULT ((0)) FOR [es_principal]
GO

ALTER TABLE [catalog].[InmuebleFoto] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO

ALTER TABLE [catalog].[Publicacion] ADD  DEFAULT ('PEN') FOR [moneda]
GO

ALTER TABLE [catalog].[Publicacion] ADD  DEFAULT ('BORRADOR') FOR [estado_publicacion]
GO

ALTER TABLE [catalog].[Publicacion] ADD  DEFAULT ((0)) FOR [es_destacado]
GO

ALTER TABLE [catalog].[Publicacion] ADD  DEFAULT ((1)) FOR [acepta_reservas]
GO

ALTER TABLE [catalog].[Publicacion] ADD  DEFAULT (sysdatetime()) FOR [created_at]
GO

ALTER TABLE [catalog].[Publicacion] ADD  DEFAULT (sysdatetime()) FOR [updated_at]
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad]  WITH CHECK ADD  CONSTRAINT [FK_BloqueoDisponibilidad_Inmueble] FOREIGN KEY([inmueble_id])
REFERENCES [catalog].[Inmueble] ([inmueble_id])
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad] CHECK CONSTRAINT [FK_BloqueoDisponibilidad_Inmueble]
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad]  WITH CHECK ADD  CONSTRAINT [FK_BloqueoDisponibilidad_Padre] FOREIGN KEY([bloqueo_padre_id])
REFERENCES [catalog].[BloqueoDisponibilidad] ([bloqueo_disponibilidad_id])
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad] CHECK CONSTRAINT [FK_BloqueoDisponibilidad_Padre]
GO

ALTER TABLE [catalog].[Inmueble]  WITH CHECK ADD  CONSTRAINT [FK_Inmueble_Edificio] FOREIGN KEY([edificio_id])
REFERENCES [catalog].[Inmueble] ([inmueble_id])
GO

ALTER TABLE [catalog].[Inmueble] CHECK CONSTRAINT [FK_Inmueble_Edificio]
GO

ALTER TABLE [catalog].[InmuebleCaracteristica]  WITH CHECK ADD  CONSTRAINT [FK_InmuebleCaracteristica_Caracteristica] FOREIGN KEY([caracteristica_id])
REFERENCES [catalog].[Caracteristica] ([caracteristica_id])
GO

ALTER TABLE [catalog].[InmuebleCaracteristica] CHECK CONSTRAINT [FK_InmuebleCaracteristica_Caracteristica]
GO

ALTER TABLE [catalog].[InmuebleCaracteristica]  WITH CHECK ADD  CONSTRAINT [FK_InmuebleCaracteristica_Inmueble] FOREIGN KEY([inmueble_id])
REFERENCES [catalog].[Inmueble] ([inmueble_id])
GO

ALTER TABLE [catalog].[InmuebleCaracteristica] CHECK CONSTRAINT [FK_InmuebleCaracteristica_Inmueble]
GO

ALTER TABLE [catalog].[InmuebleFoto]  WITH CHECK ADD  CONSTRAINT [FK_InmuebleFoto_Publicacion] FOREIGN KEY([publicacion_id])
REFERENCES [catalog].[Publicacion] ([publicacion_id])
GO

ALTER TABLE [catalog].[InmuebleFoto] CHECK CONSTRAINT [FK_InmuebleFoto_Publicacion]
GO

ALTER TABLE [catalog].[Publicacion]  WITH CHECK ADD  CONSTRAINT [FK_Publicacion_Inmueble] FOREIGN KEY([inmueble_id])
REFERENCES [catalog].[Inmueble] ([inmueble_id])
GO

ALTER TABLE [catalog].[Publicacion] CHECK CONSTRAINT [FK_Publicacion_Inmueble]
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad]  WITH CHECK ADD  CONSTRAINT [CK_BloqueoDisponibilidad_Origen] CHECK  (([origen]='OTRO' OR [origen]='MANTENIMIENTO' OR [origen]='MANUAL'))
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad] CHECK CONSTRAINT [CK_BloqueoDisponibilidad_Origen]
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad]  WITH CHECK ADD  CONSTRAINT [CK_BloqueoDisponibilidad_Rango] CHECK  (([fecha_fin]>=[fecha_inicio]))
GO

ALTER TABLE [catalog].[BloqueoDisponibilidad] CHECK CONSTRAINT [CK_BloqueoDisponibilidad_Rango]
GO

ALTER TABLE [catalog].[Caracteristica]  WITH CHECK ADD  CONSTRAINT [CK_Caracteristica_TipoDato] CHECK  (([tipo_dato]='NUMERO' OR [tipo_dato]='TEXTO' OR [tipo_dato]='BOOLEAN'))
GO

ALTER TABLE [catalog].[Caracteristica] CHECK CONSTRAINT [CK_Caracteristica_TipoDato]
GO

ALTER TABLE [catalog].[Inmueble]  WITH CHECK ADD  CONSTRAINT [CK_Inmueble_Estado] CHECK  (([estado_operativo]='INACTIVO' OR [estado_operativo]='MANTENIMIENTO' OR [estado_operativo]='OCUPADO' OR [estado_operativo]='RESERVADO' OR [estado_operativo]='DISPONIBLE'))
GO

ALTER TABLE [catalog].[Inmueble] CHECK CONSTRAINT [CK_Inmueble_Estado]
GO

ALTER TABLE [catalog].[Inmueble]  WITH CHECK ADD  CONSTRAINT [CK_Inmueble_NoAutoReferencia] CHECK  (([edificio_id] IS NULL OR [edificio_id]<>[inmueble_id]))
GO

ALTER TABLE [catalog].[Inmueble] CHECK CONSTRAINT [CK_Inmueble_NoAutoReferencia]
GO

ALTER TABLE [catalog].[Inmueble]  WITH CHECK ADD  CONSTRAINT [CK_Inmueble_RelacionTipo] CHECK  (([tipo_inmueble]='EDIFICIO' AND [edificio_id] IS NULL AND [planta] IS NULL AND [letra] IS NULL OR ([tipo_inmueble]='LOCAL' OR [tipo_inmueble]='PISO') AND [edificio_id] IS NOT NULL))
GO

ALTER TABLE [catalog].[Inmueble] CHECK CONSTRAINT [CK_Inmueble_RelacionTipo]
GO

ALTER TABLE [catalog].[Inmueble]  WITH CHECK ADD  CONSTRAINT [CK_Inmueble_Tipo] CHECK  (([tipo_inmueble]='LOCAL' OR [tipo_inmueble]='PISO' OR [tipo_inmueble]='EDIFICIO'))
GO

ALTER TABLE [catalog].[Inmueble] CHECK CONSTRAINT [CK_Inmueble_Tipo]
GO

ALTER TABLE [catalog].[InmuebleFoto]  WITH CHECK ADD  CONSTRAINT [CK_InmuebleFoto_Orden] CHECK  (([orden_visual]>(0)))
GO

ALTER TABLE [catalog].[InmuebleFoto] CHECK CONSTRAINT [CK_InmuebleFoto_Orden]
GO

ALTER TABLE [catalog].[Publicacion]  WITH CHECK ADD  CONSTRAINT [CK_Publicacion_Estado] CHECK  (([estado_publicacion]='RETIRADO' OR [estado_publicacion]='PAUSADO' OR [estado_publicacion]='PUBLICADO' OR [estado_publicacion]='BORRADOR'))
GO

ALTER TABLE [catalog].[Publicacion] CHECK CONSTRAINT [CK_Publicacion_Estado]
GO
