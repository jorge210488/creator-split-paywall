import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1762454028778 implements MigrationInterface {
    name = 'InitialSchema1762454028778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."webhook_deliveries_status_enum" AS ENUM('pending', 'success', 'failed', 'retrying')`);
        await queryRunner.query(`CREATE TABLE "webhook_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying(500) NOT NULL, "payload" text NOT NULL, "status" "public"."webhook_deliveries_status_enum" NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "lastError" text, "responseStatus" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "delivered_at" TIMESTAMP, CONSTRAINT "PK_535dd409947fb6d8fc6dfc0112a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "processed_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tx_hash" character varying(66) NOT NULL, "log_index" integer NOT NULL, "block_number" integer NOT NULL, "event_name" character varying(100) NOT NULL, "eventData" jsonb, "processed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a08d68aa0747daea9efd2ddea53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_468e16efde86838e191b1e4180" ON "processed_events" ("tx_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_06041e6cf716b7fac548965559" ON "processed_events" ("block_number") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3bbf8fa5b8368202f9e6fefb35" ON "processed_events" ("tx_hash", "log_index") `);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "expiry_timestamp" bigint NOT NULL, "activated_at" TIMESTAMP NOT NULL, "amountPaid" numeric(78,0) NOT NULL, "tx_hash" character varying(66) NOT NULL, "block_number" integer NOT NULL, "log_index" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "wallet_id" uuid, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4333e92f970928b27faad72b85" ON "subscriptions" ("activated_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_58114ff31ed667dadb5fa303f3" ON "subscriptions" ("tx_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_13217dee2892d1972850189b64" ON "subscriptions" ("wallet_id", "activated_at") `);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(78,0) NOT NULL, "tx_hash" character varying(66) NOT NULL, "block_number" integer NOT NULL, "log_index" integer NOT NULL, "timestamp" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "wallet_id" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1b8b5b94498332364904da9ab8" ON "payments" ("tx_hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_4859a43df82c9dda841c67f1ff" ON "payments" ("block_number") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a7066e87314e62a56e070d55a7" ON "payments" ("tx_hash", "log_index") `);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "address" character varying(42) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f907d5fd09a9d374f1da4e13bd3" UNIQUE ("address"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f907d5fd09a9d374f1da4e13bd" ON "wallets" ("address") `);
        await queryRunner.query(`CREATE TABLE "payouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "payeeAddress" character varying(42) NOT NULL, "amount" numeric(78,0) NOT NULL, "tx_hash" character varying(66) NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_76855dc4f0a6c18c72eea302e87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2e9241ed8091c05c1d88ecbbc9" ON "payouts" ("payeeAddress") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a1a847fa5933b9e523052176e" ON "payouts" ("tx_hash") `);
        await queryRunner.query(`CREATE TABLE "creators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "walletAddress" character varying(42) NOT NULL, "name" character varying(255), "email" character varying(255), "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f5088986e84c4a376ab9d8076e0" UNIQUE ("walletAddress"), CONSTRAINT "PK_b27dd693f7df17bbfc21f00166a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "address" character varying(42) NOT NULL, "network" character varying(50) NOT NULL, "start_block" integer, "last_processed_block" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_71a93ca1569ed761dced911f0a4" UNIQUE ("address"), CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_71a93ca1569ed761dced911f0a" ON "contracts" ("address") `);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('create', 'update', 'delete', 'read')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entityType" character varying(100) NOT NULL, "entityId" character varying(100) NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL, "actorAddress" character varying(42), "changes" jsonb, "ipAddress" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_01993ae76b293d3b866cc3a125" ON "audit_logs" ("entityType") `);
        await queryRunner.query(`CREATE TABLE "collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "walletAddress" character varying(42) NOT NULL, "name" character varying(255), "shares" integer NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f579a5df9d66287f400806ad875" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."anomalies_type_enum" AS ENUM('suspicious_pattern', 'unusual_volume', 'rapid_subscription', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."anomalies_severity_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`CREATE TABLE "anomalies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."anomalies_type_enum" NOT NULL, "severity" "public"."anomalies_severity_enum" NOT NULL DEFAULT 'medium', "walletAddress" character varying(42), "description" text NOT NULL, "metadata" jsonb, "resolved" boolean NOT NULL DEFAULT false, "detected_at" TIMESTAMP NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP, CONSTRAINT "PK_85dc6428a06c59628d40b1c5f8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f306cdfe3c558f50b02f77cbad" ON "anomalies" ("walletAddress") `);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_cac20eb288772fbe28c0300d4a3" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_1bdffa25425538e630d8eb8a8bc" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_1bdffa25425538e630d8eb8a8bc"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_cac20eb288772fbe28c0300d4a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f306cdfe3c558f50b02f77cbad"`);
        await queryRunner.query(`DROP TABLE "anomalies"`);
        await queryRunner.query(`DROP TYPE "public"."anomalies_severity_enum"`);
        await queryRunner.query(`DROP TYPE "public"."anomalies_type_enum"`);
        await queryRunner.query(`DROP TABLE "collaborators"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01993ae76b293d3b866cc3a125"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_71a93ca1569ed761dced911f0a"`);
        await queryRunner.query(`DROP TABLE "contracts"`);
        await queryRunner.query(`DROP TABLE "creators"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a1a847fa5933b9e523052176e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e9241ed8091c05c1d88ecbbc9"`);
        await queryRunner.query(`DROP TABLE "payouts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f907d5fd09a9d374f1da4e13bd"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7066e87314e62a56e070d55a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4859a43df82c9dda841c67f1ff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b8b5b94498332364904da9ab8"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_13217dee2892d1972850189b64"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58114ff31ed667dadb5fa303f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4333e92f970928b27faad72b85"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3bbf8fa5b8368202f9e6fefb35"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06041e6cf716b7fac548965559"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_468e16efde86838e191b1e4180"`);
        await queryRunner.query(`DROP TABLE "processed_events"`);
        await queryRunner.query(`DROP TABLE "webhook_deliveries"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_deliveries_status_enum"`);
    }

}
