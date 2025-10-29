import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueEmailConstraint1761736967030
    implements MigrationInterface
{
    name = 'AddUniqueEmailConstraint1761736967030';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar NOT NULL, "done" boolean NOT NULL, "dueDate" varchar NOT NULL, "ownerId" varchar)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_tasks"("id", "title", "description", "done", "dueDate", "ownerId") SELECT "id", "title", "description", "done", "dueDate", "ownerId" FROM "tasks"`,
        );
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(
            `ALTER TABLE "temporary_tasks" RENAME TO "tasks"`,
        );
        await queryRunner.query(
            `CREATE TABLE "temporary_users" ("id" varchar PRIMARY KEY NOT NULL, "fullname" varchar NOT NULL, "email" varchar NOT NULL, "pass" varchar NOT NULL)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_users"("id", "fullname", "email", "pass") SELECT "id", "fullname", "email", "pass" FROM "users"`,
        );
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(
            `ALTER TABLE "temporary_users" RENAME TO "users"`,
        );
        await queryRunner.query(
            `CREATE TABLE "temporary_users" ("id" varchar PRIMARY KEY NOT NULL, "fullname" varchar NOT NULL, "email" varchar NOT NULL, "pass" varchar NOT NULL, CONSTRAINT "UQ_75180bd8e62d624af9fa502f352" UNIQUE ("email"))`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_users"("id", "fullname", "email", "pass") SELECT "id", "fullname", "email", "pass" FROM "users"`,
        );
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(
            `ALTER TABLE "temporary_users" RENAME TO "users"`,
        );
        await queryRunner.query(
            `CREATE TABLE "temporary_tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar NOT NULL, "done" boolean NOT NULL, "dueDate" varchar NOT NULL, "ownerId" varchar, CONSTRAINT "FK_607de52438268ab19a406349427" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_tasks"("id", "title", "description", "done", "dueDate", "ownerId") SELECT "id", "title", "description", "done", "dueDate", "ownerId" FROM "tasks"`,
        );
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(
            `ALTER TABLE "temporary_tasks" RENAME TO "tasks"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tasks" RENAME TO "temporary_tasks"`,
        );
        await queryRunner.query(
            `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar NOT NULL, "done" boolean NOT NULL, "dueDate" varchar NOT NULL, "ownerId" varchar)`,
        );
        await queryRunner.query(
            `INSERT INTO "tasks"("id", "title", "description", "done", "dueDate", "ownerId") SELECT "id", "title", "description", "done", "dueDate", "ownerId" FROM "temporary_tasks"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_tasks"`);
        await queryRunner.query(
            `ALTER TABLE "users" RENAME TO "temporary_users"`,
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "fullname" varchar NOT NULL, "email" varchar NOT NULL, "pass" varchar NOT NULL)`,
        );
        await queryRunner.query(
            `INSERT INTO "users"("id", "fullname", "email", "pass") SELECT "id", "fullname", "email", "pass" FROM "temporary_users"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_users"`);
        await queryRunner.query(
            `ALTER TABLE "users" RENAME TO "temporary_users"`,
        );
        await queryRunner.query(
            `CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "fullname" varchar NOT NULL, "email" varchar NOT NULL, "pass" varchar NOT NULL)`,
        );
        await queryRunner.query(
            `INSERT INTO "users"("id", "fullname", "email", "pass") SELECT "id", "fullname", "email", "pass" FROM "temporary_users"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_users"`);
        await queryRunner.query(
            `ALTER TABLE "tasks" RENAME TO "temporary_tasks"`,
        );
        await queryRunner.query(
            `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "description" varchar NOT NULL, "done" boolean NOT NULL, "dueDate" varchar NOT NULL, "ownerId" varchar, CONSTRAINT "FK_a132ba8200c3abdc271d4a701d8" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
        );
        await queryRunner.query(
            `INSERT INTO "tasks"("id", "title", "description", "done", "dueDate", "ownerId") SELECT "id", "title", "description", "done", "dueDate", "ownerId" FROM "temporary_tasks"`,
        );
        await queryRunner.query(`DROP TABLE "temporary_tasks"`);
    }
}
