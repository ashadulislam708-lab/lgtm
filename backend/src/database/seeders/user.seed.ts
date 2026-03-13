import { DataSource } from 'typeorm';
import { User } from 'src/modules/users/user.entity';
import { RolesEnum } from 'src/shared/enums/role.enum';
import { ActiveStatusEnum } from 'src/shared/enums/active-status.enum';
import * as bcrypt from 'bcrypt';

const FIRST_NAMES = [
    'James',
    'Mary',
    'Robert',
    'Patricia',
    'John',
    'Jennifer',
    'Michael',
    'Linda',
    'David',
    'Elizabeth',
    'William',
    'Barbara',
    'Richard',
    'Susan',
    'Joseph',
    'Jessica',
    'Thomas',
    'Sarah',
    'Christopher',
    'Karen',
    'Charles',
    'Lisa',
    'Daniel',
    'Nancy',
    'Matthew',
    'Betty',
    'Anthony',
    'Margaret',
    'Mark',
    'Sandra',
    'Donald',
    'Ashley',
    'Steven',
    'Dorothy',
    'Paul',
    'Kimberly',
    'Andrew',
    'Emily',
    'Joshua',
    'Donna',
    'Kenneth',
    'Michelle',
    'Kevin',
    'Carol',
    'Brian',
    'Amanda',
    'George',
    'Melissa',
    'Timothy',
    'Deborah',
];

const LAST_NAMES = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
    'Lee',
    'Perez',
    'Thompson',
    'White',
    'Harris',
    'Sanchez',
    'Clark',
    'Ramirez',
    'Lewis',
    'Robinson',
    'Walker',
    'Young',
    'Allen',
    'King',
    'Wright',
    'Scott',
    'Torres',
    'Nguyen',
    'Hill',
    'Flores',
    'Green',
    'Adams',
    'Nelson',
    'Baker',
    'Hall',
    'Rivera',
    'Campbell',
    'Mitchell',
    'Carter',
    'Roberts',
];

function randomDate(monthsBack: number): Date {
    const now = new Date();
    const past = new Date(
        now.getTime() - monthsBack * 30 * 24 * 60 * 60 * 1000,
    );
    const diff = now.getTime() - past.getTime();
    return new Date(past.getTime() + Math.random() * diff);
}

export async function seedUsers(dataSource: DataSource): Promise<User[]> {
    const userRepository = dataSource.getRepository(User);

    console.log('Seeding users...');

    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const users: Partial<User>[] = [];

    // 2 Deterministic test accounts (for API testing)
    users.push(
        {
            email: 'test-admin@orderflow.com',
            password: hashedPassword,
            fullName: 'Test Admin',
            firstName: 'Test',
            lastName: 'Admin',
            role: RolesEnum.ADMIN,
            isActive: ActiveStatusEnum.ACTIVE,
            emailVerified: true,
            isVerified: true,
            createdAt: new Date('2025-01-01'),
        },
        {
            email: 'test-customer@orderflow.com',
            password: hashedPassword,
            fullName: 'Test Customer',
            firstName: 'Test',
            lastName: 'Customer',
            role: RolesEnum.USER,
            isActive: ActiveStatusEnum.ACTIVE,
            emailVerified: true,
            isVerified: true,
            createdAt: new Date('2025-01-15'),
        },
    );

    // 3 Admin users
    const adminEmails = [
        'admin@orderflow.com',
        'admin2@orderflow.com',
        'admin3@orderflow.com',
    ];
    const adminNames = ['Admin User', 'Admin Manager', 'Admin Supervisor'];
    for (let i = 0; i < 3; i++) {
        users.push({
            email: adminEmails[i],
            password: hashedPassword,
            fullName: adminNames[i],
            firstName: adminNames[i].split(' ')[0],
            lastName: adminNames[i].split(' ')[1],
            role: RolesEnum.ADMIN,
            isActive: ActiveStatusEnum.ACTIVE,
            emailVerified: true,
            isVerified: true,
            createdAt: randomDate(6),
        });
    }

    // 50 Customer users
    for (let i = 1; i <= 50; i++) {
        const firstName =
            FIRST_NAMES[i - 1] || FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = LAST_NAMES[i - 1] || LAST_NAMES[i % LAST_NAMES.length];
        users.push({
            email: `customer${i}@test.com`,
            password: hashedPassword,
            fullName: `${firstName} ${lastName}`,
            firstName,
            lastName,
            role: RolesEnum.USER,
            isActive: ActiveStatusEnum.ACTIVE,
            emailVerified: true,
            isVerified: true,
            createdAt: randomDate(6),
        });
    }

    // Insert in batches
    const savedUsers: User[] = [];
    for (let i = 0; i < users.length; i += 50) {
        const batch = users.slice(i, i + 50);
        const created = userRepository.create(batch);
        const saved = await userRepository.save(created);
        savedUsers.push(...saved);
    }

    console.log(
        `Created ${savedUsers.length} users (2 test accounts + 3 admins + 50 customers)`,
    );
    return savedUsers;
}
