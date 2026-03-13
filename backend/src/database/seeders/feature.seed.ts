import { DataSource } from 'typeorm';
import { Feature } from 'src/modules/features/feature.entity';

const BRANDS = [
    'Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG', 'Bosch',
    'Philips', 'Dyson', 'Bose', 'Dell', 'Logitech', 'JBL', 'Anker',
    null, null, null,
];

const FEATURE_TEMPLATES: { name: string; description: string; priceRange: [number, number] }[] = [
    { name: 'Smart Home Hub', description: 'Central control for all your smart home devices.', priceRange: [49.99, 299.99] },
    { name: 'Noise Cancelling Earbuds', description: 'Immersive audio with active noise cancellation.', priceRange: [79.99, 349.99] },
    { name: 'Portable Bluetooth Speaker', description: 'Compact speaker with rich, powerful sound.', priceRange: [29.99, 199.99] },
    { name: '4K Action Camera', description: 'Capture every adventure in stunning 4K resolution.', priceRange: [99.99, 499.99] },
    { name: 'Ergonomic Office Chair', description: 'All-day comfort with lumbar support and adjustable height.', priceRange: [149.99, 599.99] },
    { name: 'Electric Toothbrush Pro', description: 'Advanced sonic cleaning for healthier gums.', priceRange: [29.99, 149.99] },
    { name: 'Air Purifier HEPA', description: 'Removes 99.97% of airborne particles.', priceRange: [99.99, 399.99] },
    { name: 'Fitness Smartwatch', description: 'Track workouts, heart rate, and sleep patterns.', priceRange: [49.99, 399.99] },
    { name: 'Robot Vacuum Cleaner', description: 'Automated floor cleaning with smart navigation.', priceRange: [199.99, 799.99] },
    { name: 'Wireless Charging Pad', description: 'Fast wireless charging for all Qi-compatible devices.', priceRange: [14.99, 59.99] },
    { name: 'Smart Thermostat', description: 'Energy-efficient climate control with app integration.', priceRange: [99.99, 249.99] },
    { name: 'Mesh WiFi System', description: 'Whole-home WiFi coverage with zero dead spots.', priceRange: [149.99, 499.99] },
    { name: 'Standing Desk Converter', description: 'Transform any desk into a sit-stand workstation.', priceRange: [79.99, 349.99] },
    { name: 'LED Strip Light Kit', description: 'Customizable ambient lighting for any room.', priceRange: [14.99, 79.99] },
    { name: 'Coffee Maker Deluxe', description: 'Brew barista-quality coffee at home.', priceRange: [49.99, 299.99] },
    { name: 'Digital Drawing Tablet', description: 'Professional-grade drawing surface with pressure sensitivity.', priceRange: [49.99, 499.99] },
    { name: 'Mechanical Gaming Keyboard', description: 'RGB backlit mechanical switches for competitive gaming.', priceRange: [59.99, 199.99] },
    { name: 'Ultrawide Monitor 34"', description: 'Immersive curved display for work and play.', priceRange: [299.99, 999.99] },
    { name: 'Portable Power Station', description: 'High-capacity battery for camping and emergencies.', priceRange: [199.99, 799.99] },
    { name: 'Smart Door Lock', description: 'Keyless entry with fingerprint and app control.', priceRange: [99.99, 349.99] },
    { name: 'Waterproof Hiking Boots', description: 'Durable boots for all-terrain adventures.', priceRange: [69.99, 249.99] },
    { name: 'Aromatherapy Diffuser', description: 'Ultrasonic mist diffuser with LED mood lighting.', priceRange: [19.99, 79.99] },
    { name: 'Wireless Gaming Mouse', description: 'Ultra-low latency wireless mouse with customizable buttons.', priceRange: [39.99, 149.99] },
    { name: 'Insulated Water Bottle', description: 'Keeps drinks cold 24h or hot 12h.', priceRange: [14.99, 49.99] },
    { name: 'Yoga Mat Premium', description: 'Extra-thick non-slip mat for comfortable practice.', priceRange: [19.99, 89.99] },
    { name: 'Electric Scooter', description: 'Foldable e-scooter with 25-mile range.', priceRange: [299.99, 799.99] },
    { name: 'Sous Vide Precision Cooker', description: 'Restaurant-quality cooking with precise temperature control.', priceRange: [69.99, 199.99] },
    { name: 'Handheld Garment Steamer', description: 'Wrinkle-free clothes in minutes without an ironing board.', priceRange: [24.99, 79.99] },
    { name: 'Compact Binoculars', description: 'Lightweight optics for birdwatching and outdoor events.', priceRange: [29.99, 149.99] },
    { name: 'Desk Organizer Set', description: 'Keep your workspace tidy with modular storage.', priceRange: [14.99, 59.99] },
    { name: 'Solar Phone Charger', description: 'Eco-friendly charging on the go with solar panels.', priceRange: [19.99, 79.99] },
    { name: 'Weighted Blanket', description: 'Calming weighted blanket for better sleep.', priceRange: [39.99, 149.99] },
    { name: 'Electric Kettle Glass', description: 'Borosilicate glass kettle with rapid boil.', priceRange: [24.99, 69.99] },
    { name: 'Streaming Microphone USB', description: 'Studio-quality condenser mic for podcasting and streaming.', priceRange: [49.99, 199.99] },
    { name: 'Car Dash Camera 4K', description: 'Front and rear recording with night vision.', priceRange: [79.99, 249.99] },
    { name: 'Laptop Backpack Anti-Theft', description: 'Water-resistant backpack with hidden zipper and USB port.', priceRange: [29.99, 99.99] },
    { name: 'Smart Plant Monitor', description: 'Tracks soil moisture, light, and temperature for your plants.', priceRange: [19.99, 59.99] },
    { name: 'Massage Gun Pro', description: 'Deep tissue percussion massager for muscle recovery.', priceRange: [79.99, 299.99] },
    { name: 'Portable Projector Mini', description: 'Pocket-sized projector with 1080p support.', priceRange: [99.99, 399.99] },
    { name: 'Electric Wine Opener', description: 'One-touch rechargeable corkscrew with foil cutter.', priceRange: [19.99, 49.99] },
    { name: 'Pet Camera Treat Dispenser', description: 'Watch and interact with your pet remotely.', priceRange: [49.99, 149.99] },
    { name: 'Resistance Band Set Pro', description: 'Full-body workout set with 5 resistance levels.', priceRange: [14.99, 49.99] },
    { name: 'Smart Scale Body Comp', description: 'Measures weight, BMI, muscle mass, and more.', priceRange: [24.99, 79.99] },
    { name: 'Bamboo Cutting Board Set', description: 'Eco-friendly cutting boards in three sizes.', priceRange: [14.99, 49.99] },
    { name: 'Night Vision Monocular', description: 'See clearly in complete darkness up to 300m.', priceRange: [99.99, 399.99] },
];

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(min: number, max: number): number {
    const price = Math.random() * (max - min) + min;
    return Math.round(price * 100) / 100;
}

function randomRating(): number {
    return Math.round((Math.random() * 5) * 10) / 10;
}

export async function seedFeatures(dataSource: DataSource): Promise<Feature[]> {
    const featureRepository = dataSource.getRepository(Feature);

    console.log('Seeding features...');

    const features: Partial<Feature>[] = [];

    // 5 deterministic test features
    features.push(
        {
            name: 'Premium Wireless Headphones',
            description: 'High-fidelity wireless headphones with active noise cancellation and 30-hour battery life.',
            price: 199.99,
            sku: 'FEAT-TEST-001',
            stock: 150,
            isFeatured: true,
            isActive: true,
            rating: 4.7,
            reviewCount: 89,
            brand: 'Sony',
        },
        {
            name: 'Organic Green Tea Set',
            description: 'Premium collection of 6 organic green teas sourced from Japanese highlands.',
            price: 29.99,
            sku: 'FEAT-TEST-002',
            stock: 500,
            isFeatured: true,
            isActive: true,
            rating: 4.5,
            reviewCount: 234,
            brand: 'TeaHouse',
        },
        {
            name: 'Running Shoes Pro',
            description: 'Lightweight performance running shoes with responsive cushioning.',
            price: 129.99,
            sku: 'FEAT-TEST-003',
            stock: 0,
            isFeatured: false,
            isActive: true,
            rating: 4.2,
            reviewCount: 56,
            brand: 'Nike',
        },
        {
            name: 'Vintage Desk Lamp',
            description: 'Retro-style adjustable desk lamp with warm LED bulb.',
            price: 89.99,
            sku: 'FEAT-TEST-004',
            stock: 25,
            isFeatured: false,
            isActive: false,
            rating: 3.8,
            reviewCount: 12,
            brand: 'RetroLight',
        },
        {
            name: 'Budget USB Cable',
            description: 'Durable USB-C to USB-A cable, 6ft braided nylon.',
            price: 4.99,
            sku: 'FEAT-TEST-005',
            stock: 1000,
            isFeatured: false,
            isActive: true,
            rating: 0,
            reviewCount: 0,
            brand: undefined,
        },
    );

    // 45 random features from templates
    for (let i = 0; i < FEATURE_TEMPLATES.length; i++) {
        const template = FEATURE_TEMPLATES[i];
        const [minPrice, maxPrice] = template.priceRange;
        const isFeatured = Math.random() < 0.2;
        const isActive = Math.random() < 0.9;
        const reviewCount = randomBetween(0, 500);
        const rating = reviewCount === 0 ? 0 : randomRating();
        const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];

        features.push({
            name: template.name,
            description: template.description,
            price: randomPrice(minPrice, maxPrice),
            sku: `FEAT-${String(i + 6).padStart(5, '0')}`,
            stock: randomBetween(0, 1000),
            isFeatured,
            isActive,
            rating,
            reviewCount,
            brand: brand ?? undefined,
        });
    }

    // Insert in a single batch
    const created = featureRepository.create(features);
    const savedFeatures = await featureRepository.save(created);

    console.log(`Created ${savedFeatures.length} features (5 known test features + 45 random)`);
    return savedFeatures;
}
