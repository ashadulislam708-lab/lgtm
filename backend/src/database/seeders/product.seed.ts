import { DataSource } from 'typeorm';
import { Product } from 'src/modules/products/entities/product.entity';

const CATEGORIES = [
    'Electronics',
    'Clothing',
    'Books',
    'Home & Garden',
    'Sports',
    'Food & Beverages',
    'Beauty',
    'Toys',
    'Office Supplies',
    'Automotive',
];

const PRODUCT_TEMPLATES: Record<string, { names: string[]; priceRange: [number, number] }> = {
    Electronics: {
        names: [
            'Wireless Bluetooth Headphones', 'USB-C Charging Cable', 'Portable Power Bank',
            'Mechanical Keyboard', 'Gaming Mouse', 'Webcam HD 1080p', 'Smart Watch',
            'Bluetooth Speaker', 'Noise Cancelling Earbuds', 'Laptop Stand',
            'USB Hub 7-Port', 'Wireless Charger Pad', 'HDMI Cable 6ft',
            'External SSD 500GB', 'Screen Protector Kit',
        ],
        priceRange: [15, 300],
    },
    Clothing: {
        names: [
            'Cotton T-Shirt', 'Slim Fit Jeans', 'Hooded Sweatshirt', 'Running Shoes',
            'Leather Belt', 'Wool Scarf', 'Baseball Cap', 'Crew Socks Pack',
            'Down Jacket', 'Cargo Shorts', 'Polo Shirt', 'Denim Jacket',
            'Sneakers Classic', 'Dress Shirt', 'Athletic Shorts',
        ],
        priceRange: [10, 150],
    },
    Books: {
        names: [
            'JavaScript: The Good Parts', 'Clean Code', 'Design Patterns',
            'The Pragmatic Programmer', 'Algorithms 4th Edition', 'Node.js in Action',
            'TypeScript Handbook', 'Database Internals', 'System Design Interview',
            'Refactoring', 'Domain-Driven Design', 'The Art of War',
            'Sapiens', 'Atomic Habits', 'Deep Work',
        ],
        priceRange: [8, 60],
    },
    'Home & Garden': {
        names: [
            'Ceramic Plant Pot', 'LED Desk Lamp', 'Throw Pillow Set', 'Wall Clock',
            'Bath Towel Set', 'Kitchen Scale', 'Cutting Board Bamboo',
            'Storage Bins Set', 'Shower Curtain', 'Picture Frame Set',
            'Scented Candle', 'Door Mat', 'Herb Garden Kit',
            'Tool Set 50pc', 'Vacuum Cleaner',
        ],
        priceRange: [10, 200],
    },
    Sports: {
        names: [
            'Yoga Mat', 'Resistance Bands Set', 'Jump Rope', 'Water Bottle 32oz',
            'Foam Roller', 'Dumbbells 10lb Pair', 'Running Belt', 'Sports Armband',
            'Tennis Balls Can', 'Basketball Indoor', 'Soccer Ball Size 5',
            'Cycling Gloves', 'Swimming Goggles', 'Fitness Tracker Band',
            'Pull-Up Bar',
        ],
        priceRange: [5, 100],
    },
    'Food & Beverages': {
        names: [
            'Organic Green Tea Box', 'Premium Coffee Beans 1lb', 'Dark Chocolate Bar',
            'Mixed Nuts Pack', 'Protein Bars 12-Pack', 'Sparkling Water Case',
            'Olive Oil Extra Virgin', 'Honey Organic 16oz', 'Dried Fruit Mix',
            'Granola Bars Pack', 'Matcha Powder', 'Coconut Water Pack',
            'Energy Drink 6-Pack', 'Trail Mix Bag', 'Herbal Tea Sampler',
        ],
        priceRange: [5, 50],
    },
    Beauty: {
        names: [
            'Moisturizing Face Cream', 'Sunscreen SPF 50', 'Lip Balm Set',
            'Hair Conditioner', 'Shampoo Organic', 'Face Wash Gel',
            'Hand Cream Set', 'Body Lotion Aloe', 'Eye Cream Anti-Aging',
            'Makeup Brush Set', 'Nail Polish Set', 'Perfume Eau de Toilette',
            'Face Mask Sheet Pack', 'Deodorant Natural', 'Hair Serum',
        ],
        priceRange: [8, 80],
    },
    Toys: {
        names: [
            'Building Blocks 500pc', 'Remote Control Car', 'Puzzle 1000 Pieces',
            'Board Game Classic', 'Stuffed Animal Bear', 'Action Figure Set',
            'Coloring Book Pack', 'Play-Doh Set', 'Toy Train Set',
            'Science Kit Chemistry', 'Card Game Strategy', 'Drone Mini',
            'Nerf Blaster', 'Lego Architecture Set', 'RC Helicopter',
        ],
        priceRange: [10, 100],
    },
    'Office Supplies': {
        names: [
            'Ballpoint Pens 20-Pack', 'Sticky Notes Pack', 'Notebook A5 Lined',
            'File Folders Set', 'Stapler Desktop', 'Paper Clips Box',
            'Highlighters 6-Pack', 'Tape Dispenser', 'Scissors Stainless',
            'Binder Clips Assorted', 'White Board Markers', 'Desk Organizer',
            'Label Maker', 'Calculator Scientific', 'Pencil Sharpener Electric',
        ],
        priceRange: [5, 50],
    },
    Automotive: {
        names: [
            'Car Phone Mount', 'Dash Cam 1080p', 'Tire Pressure Gauge',
            'Car Air Freshener Pack', 'Emergency Road Kit', 'Seat Cushion Ergonomic',
            'Windshield Sun Shade', 'Car Vacuum Cleaner', 'LED Headlight Bulbs',
            'Steering Wheel Cover', 'Car Wash Kit', 'Trunk Organizer',
            'Battery Jump Starter', 'Car Floor Mats', 'Blind Spot Mirrors',
        ],
        priceRange: [8, 150],
    },
};

function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(min: number, max: number): number {
    const price = Math.random() * (max - min) + min;
    return Math.round(price * 100) / 100;
}

function generateSku(category: string, index: number): string {
    const prefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const num = String(index).padStart(5, '0');
    return `${prefix}-${num}`;
}

export async function seedProducts(dataSource: DataSource): Promise<Product[]> {
    const productRepository = dataSource.getRepository(Product);

    console.log('Seeding products...');

    const products: Partial<Product>[] = [];

    // 3 Deterministic test products (for API testing)
    products.push(
        {
            name: 'Test Widget Alpha',
            description: 'Deterministic test product for API testing. Category: Electronics.',
            price: 25.00,
            category: 'Electronics',
            sku: 'TEST-PROD-001',
            stockQuantity: 100,
            isActive: true,
        },
        {
            name: 'Test Widget Beta',
            description: 'Deterministic test product for API testing. Category: Clothing.',
            price: 75.00,
            category: 'Clothing',
            sku: 'TEST-PROD-002',
            stockQuantity: 50,
            isActive: true,
        },
        {
            name: 'Test Widget Gamma',
            description: 'Deterministic test product for API testing. Category: Books.',
            price: 15.00,
            category: 'Books',
            sku: 'TEST-PROD-003',
            stockQuantity: 200,
            isActive: true,
        },
    );

    let skuCounter = 1;

    for (const category of CATEGORIES) {
        const template = PRODUCT_TEMPLATES[category];
        const [minPrice, maxPrice] = template.priceRange;

        for (const name of template.names) {
            const isActive = Math.random() < 0.95;
            products.push({
                name,
                description: `High-quality ${name.toLowerCase()} in the ${category} category. Perfect for everyday use.`,
                price: randomPrice(minPrice, maxPrice),
                category,
                sku: generateSku(category, skuCounter++),
                stockQuantity: randomBetween(10, 500),
                isActive,
            });
        }
    }

    // Insert in batches of 100
    const savedProducts: Product[] = [];
    for (let i = 0; i < products.length; i += 100) {
        const batch = products.slice(i, i + 100);
        const created = productRepository.create(batch);
        const saved = await productRepository.save(created);
        savedProducts.push(...saved);
    }

    console.log(`Created ${savedProducts.length} products across ${CATEGORIES.length} categories`);
    return savedProducts;
}
