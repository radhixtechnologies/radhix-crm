const mongoose = require('mongoose');
const dotenv = require('dotenv');
// const colors = require('colors'); // Removed to avoid dependency error

// Load env vars
dotenv.config({ path: './.env' });

// Load Models
const Lead = require('./models/Lead');
const Deal = require('./models/Deal');
const Client = require('./models/Client');
const Contact = require('./models/Contact');
const Quotation = require('./models/Quotation');
const Proposal = require('./models/Proposal');
const Activity = require('./models/Activity');
const FollowUp = require('./models/FollowUp');
const User = require('./models/User');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedData = async () => {
    try {
        console.log('Validating Administrative User...');
        // Find a user to assign data to (usually the first admin or user found)
        const adminUser = await User.findOne();
        if (!adminUser) {
            console.error('No users found! Please create a user first.');
            process.exit(1);
        }
        const userId = adminUser._id;
        console.log(`Assigning data to user: ${adminUser.name} (${userId})`);

        // ============================================
        // 1. DELETE EXISTING DATA
        // ============================================
        console.log('Clearing existing Sales Data...');
        await Lead.deleteMany({});
        await Deal.deleteMany({});
        await Client.deleteMany({});
        await Contact.deleteMany({});
        await Quotation.deleteMany({});
        await Proposal.deleteMany({});
        await Activity.deleteMany({});
        await FollowUp.deleteMany({});
        console.log('Data Cleared!');

        // ============================================
        // 2. CREATE CLIENTS & CONTACTS
        // ============================================
        console.log('Seeding Clients & Contacts...');

        const clients = await Client.create([
            {
                name: 'TechFlow Solutions',
                company: 'TechFlow Solutions', // In case schematic var varies
                email: 'contact@techflow.io',
                phone: '+1-555-0123',
                industry: 'Technology',
                address: '123 Tech Park, Silicon Valley, CA',
                createdBy: userId
            },
            {
                name: 'GreenLeaf Energy',
                company: 'GreenLeaf Energy',
                email: 'info@greenleaf.com',
                phone: '+1-555-0199',
                industry: 'Energy',
                address: '456 Eco Drive, Austin, TX',
                createdBy: userId
            },
            {
                name: 'Apex Healthcare',
                company: 'Apex Healthcare',
                industry: 'Healthcare', 
                email: 'admin@apexhealth.org',
                phone: '+1-555-0255',
                address: '789 Wellness Way, Boston, MA',
                createdBy: userId
            }
        ]);

        const contacts = await Contact.create([
            {
                firstName: 'Sarah',
                lastName: 'Connor',
                email: 'sarah@techflow.io',
                phone: '+1-555-1111',
                client: clients[0]._id,
                company: clients[0].company, // Added Required Field
                designation: 'CTO',
                assignedTo: userId,
                createdBy: userId
            },
            {
                firstName: 'Michael',
                lastName: 'Ross',
                email: 'mike@greenleaf.com',
                phone: '+1-555-2222',
                client: clients[1]._id,
                company: clients[1].company, // Added Required Field
                designation: 'Operations Manager',
                assignedTo: userId,
                createdBy: userId
            },
            {
                firstName: 'Jessica',
                lastName: 'Pearson',
                email: 'jessica@apexhealth.org',
                phone: '+1-555-3333',
                client: clients[2]._id,
                company: clients[2].company, // Added Required Field
                designation: 'Director',
                assignedTo: userId,
                createdBy: userId
            }
        ]);

        // ============================================
        // 3. CREATE LEADS
        // ============================================
        console.log('Seeding Leads...');
        
        const leads = await Lead.create([
            {
                name: 'Global Finance AI Project', // Assuming name is title? Or name of person? Let's assume Lead Name/Title
                firstName: 'David',
                lastName: 'Wallace',
                email: 'david@dundermifflin.com',
                phone: '+1-555-4444',
                company: 'Dunder Mifflin',
                source: 'social-media', // Corrected
                status: 'new',
                temperature: 'hot',
                score: 85,
                assignedTo: userId,
                createdBy: userId
            },
            {
                name: 'Logistics ERP Upgrade',
                firstName: 'Walter',
                lastName: 'White',
                email: 'walter@graymatter.com',
                phone: '+1-555-5555',
                company: 'Gray Matter',
                source: 'website', // Corrected
                status: 'contacted',
                temperature: 'warm',
                score: 60,
                assignedTo: userId,
                createdBy: userId
            },
            {
                name: 'Retail POS System',
                firstName: 'Gustavo',
                lastName: 'Fring',
                email: 'gus@lospollos.com',
                phone: '+1-555-6666',
                company: 'Los Pollos Hermanos',
                source: 'referral', // Corrected
                status: 'qualified',
                temperature: 'hot',
                score: 90,
                assignedTo: userId,
                createdBy: userId
            },
             {
                name: 'Marketing Consultation',
                firstName: 'Saul',
                lastName: 'Goodman',
                email: 'saul@sgassociates.com',
                phone: '+1-555-7777',
                company: 'SG Associates',
                source: 'phone', // Corrected from Cold Call
                status: 'lost',
                temperature: 'cold',
                score: 20,
                assignedTo: userId,
                createdBy: userId
            }
        ]);


        // ============================================
        // 4. CREATE DEALS
        // ============================================
        console.log('Seeding Deals...');

        const deals = await Deal.create([
            {
                title: 'Enterprise Cloud Migration', // Corrected from name
                client: clients[0]._id,
                contact: contacts[0]._id,
                value: 45000,
                currency: 'USD',
                stage: 'negotiation',
                probability: 80,
                expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // +15 days
                assignedTo: userId,
                createdBy: userId
            },
            {
                title: 'Solar Panel Installation Contract', // Corrected from name
                client: clients[1]._id,
                contact: contacts[1]._id,
                value: 1200000,
                currency: 'INR',
                stage: 'proposal', 
                probability: 60,
                expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                assignedTo: userId,
                createdBy: userId
            },
            {
                title: 'Hospital Management Software', // Corrected from name
                client: clients[2]._id,
                contact: contacts[2]._id,
                value: 85000,
                currency: 'USD',
                stage: 'new-deal', 
                probability: 40,
                expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 days
                assignedTo: userId,
                createdBy: userId
            }
        ]);

        // ============================================
        // 5. CREATE PROPOSALS & QUOTATIONS
        // ============================================
        console.log('Seeding Proposals & Quotations...');

        // Proposal for Startups
        const proposal = await Proposal.create({
            proposalNumber: 'PR-1001', // Added Required Field
            deal: deals[0]._id,
            client: clients[0]._id,
            contactPersons: [contacts[0]._id],
            title: 'Cloud Migration Strategy', // Corrected from subject
            content: 'Detailed proposal for migrating on-premise servers to AWS...',
            proposalOwner: userId, // Added Required Field
            totalAmount: 45000,
            status: 'sent',
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdBy: userId
        });

        // Quotation for Manufacturing
        const quotation = await Quotation.create({
            quotationNumber: 'QUO-001001',
            quotationName: 'Solar Panel Supply Q1',
            deal: deals[1]._id,
            client: clients[1]._id,
            contact: contacts[1]._id,
            quotationDate: new Date(),
            priceValidUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            currency: 'INR',
            deliverables: [
                {
                    name: 'Supply of Panels',
                    description: 'Delivery of 50 units of 400W Monocrystalline Panels',
                    durationValue: 2,
                    durationUnit: 'weeks'
                },
                {
                    name: 'Installation',
                    description: 'Complete mounting and wiring of panels',
                    durationValue: 5,
                    durationUnit: 'days'
                }
            ],
            items: [
                {
                    itemName: 'Solar Panel Unit (400W)',
                    description: 'High efficiency monocrystalline panels',
                    quantity: 50,
                    unitPrice: 20000,
                    lineTotal: 1000000
                },
                {
                    itemName: 'Inverter Installation',
                    description: 'Installation and setup',
                    quantity: 1,
                    unitPrice: 200000,
                    lineTotal: 200000
                }
            ],
            subtotal: 1200000,
            totalTax: 0,
            grandTotal: 1200000,
            status: 'sent',
            createdBy: userId
        });

        // ============================================
        // 6. CREATE ACTIVITIES (CALENDAR DATA)
        // ============================================
        console.log('Seeding Calendar Activities...');

        const activities = await Activity.create([
             // Recent Past Activity
             {
                type: 'call',
                subject: 'Initial Requirements Gathering',
                description: 'discussed cloud architecture needs',
                relatedTo: { entityType: 'Deal', entityId: deals[0]._id, entityName: deals[0].title }, // Corrected from name
                assignedTo: userId,
                createdBy: userId,
                status: 'completed',
                completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            // Upcoming
            {
                type: 'meeting',
                subject: 'Negotiation Meeting',
                description: 'Finalize contract terms for cloud migration',
                relatedTo: { entityType: 'Deal', entityId: deals[0]._id, entityName: deals[0].title }, // Corrected from name
                assignedTo: userId,
                createdBy: userId,
                status: 'scheduled', // Corrected from pending
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // Tomorrow
            },
             {
                type: 'call',
                subject: 'Qualify Hospital Lead',
                description: 'Discuss HMS modules required',
                relatedTo: { entityType: 'Deal', entityId: deals[2]._id, entityName: deals[2].title }, // Corrected from name
                assignedTo: userId,
                createdBy: userId,
                status: 'scheduled', // Corrected from pending
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            }
        ]);


        console.log('Sales Data Successfully Seeded!');
        process.exit();

    } catch (err) {
        console.error('SEEDING ERROR:'.red);
        console.error(err.message);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`- ${key}: ${err.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

seedData();
