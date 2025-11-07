import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddMultiEventSupport1762486047644 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
