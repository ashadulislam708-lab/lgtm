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
import { seedFeatures } from './feature.seed';

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
            'features',
            'users',
        ];

        for (const table of tables) {
            try {
                await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE`);
                console.log(`  Cleared table: ${table}`);
            } catch (error) {
                console.log(
                    `  Table ${table} does not exist or could not be cleared, skipping...`,
                );
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
    console.log('\n--- Step 1/8: Users ---');
    const users = await seedUsers(dataSource);

    // Step 3: Seed products
    console.log('\n--- Step 2/8: Products ---');
    const products = await seedProducts(dataSource);

    // Step 4: Seed features
    console.log('\n--- Step 3/8: Features ---');
    const features = await seedFeatures(dataSource);

    // Step 5: Seed orders
    console.log('\n--- Step 4/8: Orders ---');
    const orders = await seedOrders(dataSource, users, products);

    // Step 6: Seed order items
    console.log('\n--- Step 5/8: Order Items ---');
    await seedOrderItems(dataSource, orders, products);

    // Step 7: Seed payments
    console.log('\n--- Step 6/8: Payments ---');
    await seedPayments(dataSource, orders);

    // Step 8: Seed notifications
    console.log('\n--- Step 7/8: Notifications ---');
    await seedNotifications(dataSource, users, orders);

    // Step 9: Seed inventory logs
    console.log('\n--- Step 8/8: Inventory Logs ---');
    await seedInventoryLogs(dataSource, products);

    console.log('\n=== Seed Summary ===');
    console.log(
        `  Users:          ${users.length} (2 test + 3 admins + 50 customers)`,
    );
    console.log(`  Products:       ${products.length} (3 test + 150 random)`);
    console.log(`  Features:       ${features.length} (5 test + 45 random)`);
    console.log(`  Orders:         ${orders.length} (4 test + 1500 random)`);
    console.log(`  Order Items:    (2-5 per order + test items)`);
    console.log(`  Payments:       ~1,800 (including test + retries)`);
    console.log(`  Notifications:  3,000+ (including test)`);
    console.log(`  Inventory Logs: 500`);
    console.log('\n=== Test Credentials ===');
    console.log('  Admin:    test-admin@orderflow.com / Password123!');
    console.log('  Customer: test-customer@orderflow.com / Password123!');

    await app.close();
    console.log('\nAll seeding completed successfully!');
}

runSeeder().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
