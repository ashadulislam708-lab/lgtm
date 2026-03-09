import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { seedUsers } from './user.seed';
import { seedProducts } from './product.seed';
import { seedOrders } from './order.seed';
import { seedOrderItems } from './order-item.seed';
import { seedPayments } from './payment.seed';
import { seedNotifications } from './notification.seed';
import { seedInventoryLogs } from './inventory-log.seed';

async function clearAllTables(dataSource: DataSource): Promise<void> {
    console.log('Clearing all tables (in reverse dependency order)...');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
        // Disable foreign key checks for clean truncation
        await queryRunner.query('SET session_replication_role = replica');

        const tables = [
            'inventory_logs',
            'notifications',
            'payments',
            'order_items',
            'orders',
            'products',
            'users',
        ];

        for (const table of tables) {
            try {
                await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE`);
                console.log(`  Cleared table: ${table}`);
            } catch (error) {
                console.log(`  Table ${table} does not exist or could not be cleared, skipping...`);
            }
        }

        // Re-enable foreign key checks
        await queryRunner.query('SET session_replication_role = DEFAULT');
    } finally {
        await queryRunner.release();
    }

    console.log('All tables cleared.\n');
}

async function runSeeder() {
    console.log('=== OrderFlow Seed Data Generator ===\n');
    console.log('Starting NestJS application...');

    const app = await NestFactory.create(AppModule, { logger: ['error'] });
    const dataSource = app.get(DataSource);

    console.log('Application started. Connected to database.\n');

    // Step 1: Clear all tables
    await clearAllTables(dataSource);

    // Step 2: Seed users
    console.log('\n--- Step 1/7: Users ---');
    const users = await seedUsers(dataSource);

    // Step 3: Seed products
    console.log('\n--- Step 2/7: Products ---');
    const products = await seedProducts(dataSource);

    // Step 4: Seed orders
    console.log('\n--- Step 3/7: Orders ---');
    const orders = await seedOrders(dataSource, users, products);

    // Step 5: Seed order items
    console.log('\n--- Step 4/7: Order Items ---');
    await seedOrderItems(dataSource, orders, products);

    // Step 6: Seed payments
    console.log('\n--- Step 5/7: Payments ---');
    await seedPayments(dataSource, orders);

    // Step 7: Seed notifications
    console.log('\n--- Step 6/7: Notifications ---');
    await seedNotifications(dataSource, users, orders);

    // Step 8: Seed inventory logs
    console.log('\n--- Step 7/7: Inventory Logs ---');
    await seedInventoryLogs(dataSource, products);

    console.log('\n=== Seed Summary ===');
    console.log(`  Users:          ${users.length} (3 admins + 50 customers)`);
    console.log(`  Products:       ${products.length} across 10 categories`);
    console.log(`  Orders:         ${orders.length} spanning 6 months`);
    console.log(`  Order Items:    (2-5 per order)`);
    console.log(`  Payments:       ~1,800 (including retries)`);
    console.log(`  Notifications:  3,000+`);
    console.log(`  Inventory Logs: 500`);

    await app.close();
    console.log('\nAll seeding completed successfully!');
}

runSeeder().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
