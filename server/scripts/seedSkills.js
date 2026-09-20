require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const SkillLibrary = require('../models/SkillLibrary');
const Employee = require('../models/Employee');

const seedSkills = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to database');

        // Get first employee (or create test data)
        const employees = await Employee.find().limit(3);

        if (employees.length === 0) {
            console.log('❌ No employees found. Please create employees first.');
            process.exit(1);
        }

        console.log(`Found ${employees.length} employees`);

        // Sample skills to add
        const sampleSkills = [
            {
                skillName: 'JavaScript',
                category: 'technical',
                proficiency: 'advanced',
                proficiencyLevel: 8,
                currentLevel: 8,
                requiredLevel: 9,
                skillSource: 'on-the-job',
                skillStatus: 'active',
                priority: 'critical',
                yearsOfExperience: 3,
            },
            {
                skillName: 'React',
                category: 'technical',
                proficiency: 'intermediate',
                proficiencyLevel: 6,
                currentLevel: 6,
                requiredLevel: 8,
                skillSource: 'training',
                skillStatus: 'active',
                priority: 'important',
                yearsOfExperience: 2,
            },
            {
                skillName: 'Communication',
                category: 'soft-skills',
                proficiency: 'advanced',
                proficiencyLevel: 8,
                currentLevel: 8,
                skillSource: 'on-the-job',
                skillStatus: 'active',
                priority: 'important',
                yearsOfExperience: 5,
            },
            {
                skillName: 'Project Management',
                category: 'managerial',
                proficiency: 'intermediate',
                proficiencyLevel: 6,
                currentLevel: 6,
                requiredLevel: 7,
                skillSource: 'certification',
                skillStatus: 'active',
                priority: 'important',
                yearsOfExperience: 2,
                certifications: [{
                    name: 'PMP',
                    issuer: 'PMI',
                    issuedDate: new Date('2023-01-15'),
                    expiryDate: new Date('2026-01-15'),
                }],
            },
            {
                skillName: 'Node.js',
                category: 'technical',
                proficiency: 'advanced',
                proficiencyLevel: 7,
                currentLevel: 7,
                requiredLevel: 8,
                skillSource: 'self-learning',
                skillStatus: 'active',
                priority: 'critical',
                yearsOfExperience: 3,
            },
        ];

        // Add skills for each employee
        let createdCount = 0;
        for (const employee of employees) {
            for (const skillData of sampleSkills) {
                // Check if skill already exists
                const existing = await Skill.findOne({
                    employee: employee._id,
                    skillName: skillData.skillName,
                });

                if (!existing) {
                    await Skill.create({
                        ...skillData,
                        employee: employee._id,
                    });
                    createdCount++;
                    console.log(`✓ Added ${skillData.skillName} for ${employee.user?.name || employee.employeeId}`);
                }
            }
        }

        console.log(`\n✅ Successfully created ${createdCount} skills`);
        console.log('\nYou can now test the Skill Matrix at: http://localhost:5173/hrm/skills/matrix');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding skills:', error);
        process.exit(1);
    }
};

seedSkills();
