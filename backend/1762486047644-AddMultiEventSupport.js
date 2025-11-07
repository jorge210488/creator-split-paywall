"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMultiEventSupport1762486047644 = void 0;
class AddMultiEventSupport1762486047644 {
    constructor() {
        this.name = 'AddMultiEventSupport1762486047644';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."config_changes_changetype_enum" AS ENUM('price_updated', 'duration_updated')`);
        await queryRunner.query(`CREATE TABLE "config_changes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "changeType" "public"."config_changes_changetype_enum" NOT NULL, "oldValue" character varying(255) NOT NULL, "newValue" character varying(255) NOT NULL, "txHash" character varying(66) NOT NULL, "blockNumber" integer NOT NULL, "logIndex" integer NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b21a293cc5c4f1de332edc58987" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ed16eaff54d2d3b16bb2349f7c" ON "config_changes" ("txHash") `);
        await queryRunner.query(`CREATE INDEX "IDX_c8f620ddc48a730dcf66547b62" ON "config_changes" ("changeType", "timestamp") `);
        await queryRunner.query(`ALTER TABLE "payouts" ADD "log_index" integer NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_41955a15c5d933a1ced3201dff" ON "payouts" ("payeeAddress", "timestamp") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_41955a15c5d933a1ced3201dff"`);
        await queryRunner.query(`ALTER TABLE "payouts" DROP COLUMN "log_index"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c8f620ddc48a730dcf66547b62"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed16eaff54d2d3b16bb2349f7c"`);
        await queryRunner.query(`DROP TABLE "config_changes"`);
        await queryRunner.query(`DROP TYPE "public"."config_changes_changetype_enum"`);
    }
}
exports.AddMultiEventSupport1762486047644 = AddMultiEventSupport1762486047644;
//# sourceMappingURL=1762486047644-AddMultiEventSupport.js.map