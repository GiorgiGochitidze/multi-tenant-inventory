import { MigrationInterface, QueryRunner } from 'typeorm';

export class StatusChangeInOrderStatus1784983930130 implements MigrationInterface {
  name = 'StatusChangeInOrderStatus1784983930130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" ADD VALUE 'CONFIRMED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum_old" AS ENUM('PENDING', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum_old" USING "status"::"text"::"public"."orders_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum_old" RENAME TO "orders_status_enum"`,
    );
  }
}
