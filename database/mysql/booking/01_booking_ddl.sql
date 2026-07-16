-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: staype_booking_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `staype_booking_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `staype_booking_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `staype_booking_db`;

--
-- Table structure for table `evaluacion_inquilino`
--

DROP TABLE IF EXISTS `evaluacion_inquilino`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion_inquilino` (
  `evaluacion_inquilino_id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int NOT NULL,
  `evaluado_por_usuario_id` int NOT NULL,
  `score_riesgo` int DEFAULT NULL,
  `historial_reservas` int DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL,
  `resultado` varchar(20) NOT NULL DEFAULT 'PENDIENTE',
  `fecha_evaluacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`evaluacion_inquilino_id`),
  KEY `idx_evaluacion_inquilino_reserva` (`reserva_id`),
  CONSTRAINT `fk_evaluacion_inquilino_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`reserva_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_evaluacion_inquilino_resultado` CHECK ((`resultado` in (_utf8mb4'PENDIENTE',_utf8mb4'APROBADO',_utf8mb4'OBSERVADO',_utf8mb4'RECHAZADO')))
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reserva`
--

DROP TABLE IF EXISTS `reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserva` (
  `reserva_id` int NOT NULL AUTO_INCREMENT,
  `inmueble_id` int NOT NULL,
  `inquilino_id` int NOT NULL,
  `estado_reserva` varchar(20) NOT NULL DEFAULT 'SOLICITADA',
  `fecha_solicitud` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `renta_pactada_mensual` decimal(12,2) DEFAULT NULL,
  `monto_total_estimado` decimal(12,2) DEFAULT NULL,
  `deposito_garantia` decimal(12,2) DEFAULT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'PEN',
  `observacion_inquilino` varchar(500) DEFAULT NULL,
  `observacion_gestor` varchar(500) DEFAULT NULL,
  `motivo_rechazo` varchar(300) DEFAULT NULL,
  `motivo_cancelacion` varchar(300) DEFAULT NULL,
  `fecha_decision` datetime(6) DEFAULT NULL,
  `gestionado_por_usuario_id` int DEFAULT NULL,
  `fecha_checkin` datetime(6) DEFAULT NULL,
  `fecha_checkout` datetime(6) DEFAULT NULL,
  `checkin_confirmado_por` int DEFAULT NULL,
  `checkout_confirmado_por` int DEFAULT NULL,
  `cancelado_por_usuario_id` int DEFAULT NULL,
  `fecha_cancelacion` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`reserva_id`),
  KEY `idx_reserva_inmueble_fechas` (`inmueble_id`,`fecha_inicio`,`fecha_fin`),
  KEY `idx_reserva_inquilino_estado` (`inquilino_id`,`estado_reserva`),
  KEY `idx_reserva_estado` (`estado_reserva`),
  CONSTRAINT `ck_reserva_estado` CHECK ((`estado_reserva` in (_utf8mb4'SOLICITADA',_utf8mb4'APROBADA',_utf8mb4'RECHAZADA',_utf8mb4'CANCELADA',_utf8mb4'ACTIVA',_utf8mb4'FINALIZADA',_utf8mb4'EXPIRADA'))),
  CONSTRAINT `ck_reserva_fechas` CHECK ((`fecha_fin` > `fecha_inicio`))
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reserva_evento`
--

DROP TABLE IF EXISTS `reserva_evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserva_evento` (
  `reserva_evento_id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `tipo_evento` varchar(30) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `fecha_evento` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`reserva_evento_id`),
  KEY `idx_reserva_evento_reserva` (`reserva_id`),
  KEY `idx_reserva_evento_fecha` (`fecha_evento`),
  CONSTRAINT `fk_reserva_evento_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`reserva_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_reserva_evento_tipo` CHECK ((`tipo_evento` in (_utf8mb4'SOLICITUD',_utf8mb4'APROBACION',_utf8mb4'RECHAZO',_utf8mb4'CHECKIN',_utf8mb4'CHECKOUT',_utf8mb4'EXTENSION',_utf8mb4'CANCELACION',_utf8mb4'NOTA')))
) ENGINE=InnoDB AUTO_INCREMENT=160 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitud_extension`
--

DROP TABLE IF EXISTS `solicitud_extension`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_extension` (
  `solicitud_extension_id` int NOT NULL AUTO_INCREMENT,
  `reserva_id` int NOT NULL,
  `solicitante_usuario_id` int NOT NULL,
  `nueva_fecha_fin` date NOT NULL,
  `motivo` varchar(500) DEFAULT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'PENDIENTE',
  `fecha_solicitud` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `fecha_decision` datetime(6) DEFAULT NULL,
  `decidido_por_usuario_id` int DEFAULT NULL,
  `comentario_decision` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`solicitud_extension_id`),
  KEY `idx_solicitud_extension_reserva` (`reserva_id`),
  KEY `idx_solicitud_extension_estado` (`estado`),
  CONSTRAINT `fk_solicitud_extension_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reserva` (`reserva_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_solicitud_extension_estado` CHECK ((`estado` in (_utf8mb4'PENDIENTE',_utf8mb4'APROBADA',_utf8mb4'RECHAZADA',_utf8mb4'CANCELADA')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-14 16:53:35
