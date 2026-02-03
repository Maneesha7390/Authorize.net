import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@127.0.0.1:27017/payment_db?authSource=admin';

const PlanSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    amount: { type: Number, required: true },
    intervalLength: { type: Number, required: true },
    intervalUnit: { type: String, required: true, enum: ['months', 'days', 'weeks', 'years'] },
    totalOccurrences: { type: Number, default: 9999 },
    trialAmount: { type: Number, default: 0 },
    trialOccurrences: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Plan = mongoose.model('Plan', PlanSchema);

const defaultPlans = [
    {
        name: 'Monthly Premium',
        description: 'Premium monthly subscription plan',
        amount: 500,
        intervalLength: 1,
        intervalUnit: 'months',
        totalOccurrences: 9999,
        trialAmount: 0,
        trialOccurrences: 0,
        isActive: true
    },
    {
        name: 'Yearly Standard',
        description: 'Standard yearly subscription plan',
        amount: 1000,
        intervalLength: 1,
        intervalUnit: 'years',
        totalOccurrences: 9999,
        trialAmount: 0,
        trialOccurrences: 0,
        isActive: true
    },
    {
        name: 'Weekly Trial',
        description: 'Weekly subscription with 1 week free trial',
        amount: 100,
        intervalLength: 1,
        intervalUnit: 'weeks',
        totalOccurrences: 9999,
        trialAmount: 0,
        trialOccurrences: 1,
        isActive: true
    }
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected effectively.');

        for (const planData of defaultPlans) {
            const existing = await Plan.findOne({ name: planData.name });
            if (existing) {
                console.log(`Plan "${planData.name}" already exists. Skipping.`);
            } else {
                await new Plan(planData).save();
                console.log(`Plan "${planData.name}" created.`);
            }
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Error seeding plans:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit();
    }
}

seed();
