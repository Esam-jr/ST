"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var adminPassword, admin, sponsorPassword, sponsor, startupCall, opportunity, budget, marketingCategory, operationsCategory, technologyCategory;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Clean up existing data
                return [4 /*yield*/, prisma.expense.deleteMany({})];
                case 1:
                    // Clean up existing data
                    _a.sent();
                    return [4 /*yield*/, prisma.category.deleteMany({})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.budget.deleteMany({})];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.sponsorshipApplication.deleteMany({})];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.sponsorshipOpportunity.deleteMany({})];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.startupCallApplication.deleteMany({})];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.startupCall.deleteMany({})];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.startup.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, bcryptjs_1.hash)('admin123', 12)];
                case 10:
                    adminPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'Admin User',
                                email: 'admin@example.com',
                                password: adminPassword,
                                role: 'ADMIN',
                            },
                        })];
                case 11:
                    admin = _a.sent();
                    return [4 /*yield*/, (0, bcryptjs_1.hash)('sponsor123', 12)];
                case 12:
                    sponsorPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: 'Sponsor User',
                                email: 'sponsor@example.com',
                                password: sponsorPassword,
                                role: 'SPONSOR',
                            },
                        })];
                case 13:
                    sponsor = _a.sent();
                    return [4 /*yield*/, prisma.startupCall.create({
                            data: {
                                title: 'Tech Innovation Challenge 2024',
                                description: 'A global competition for innovative tech startups',
                                status: 'PUBLISHED',
                                applicationDeadline: new Date('2024-12-31'),
                                publishedDate: new Date(),
                                industry: 'Technology',
                                location: 'Global',
                                fundingAmount: '$100,000',
                                requirements: ['Innovative solution', 'Market potential', 'Strong team'],
                                eligibilityCriteria: ['Early-stage startup', 'Tech-focused', 'Less than 2 years old'],
                                selectionProcess: ['Application review', 'Pitch presentation', 'Final selection'],
                                aboutSponsor: 'Leading tech investment firm',
                                applicationProcess: 'Online application followed by virtual pitch',
                                createdById: admin.id,
                            },
                        })];
                case 14:
                    startupCall = _a.sent();
                    return [4 /*yield*/, prisma.sponsorshipOpportunity.create({
                            data: {
                                title: 'Tech Innovation Challenge 2024 Sponsorship',
                                slug: 'tech-innovation-challenge-2024-sponsorship',
                                description: 'Sponsor the leading tech innovation challenge and gain exposure to top startups',
                                benefits: [
                                    'Brand visibility',
                                    'Access to innovative startups',
                                    'Networking opportunities',
                                    'Thought leadership platform'
                                ],
                                industryFocus: 'Technology',
                                tags: ['innovation', 'startups', 'tech', 'sponsorship'],
                                minAmount: 10000,
                                maxAmount: 50000,
                                status: 'OPEN',
                                eligibility: 'Open to all technology companies and investors',
                                deadline: new Date('2024-11-30'),
                                coverImage: 'https://example.com/sponsorship-cover.jpg',
                                startupCallId: startupCall.id,
                                createdById: admin.id,
                            },
                        })];
                case 15:
                    opportunity = _a.sent();
                    return [4 /*yield*/, prisma.budget.create({
                            data: {
                                totalAmount: 100000,
                                startDate: new Date('2024-01-01'),
                                endDate: new Date('2024-12-31'),
                                startupId: startupCall.id,
                            },
                        })];
                case 16:
                    budget = _a.sent();
                    return [4 /*yield*/, prisma.category.create({
                            data: {
                                name: 'Marketing',
                                allocatedAmount: 30000,
                                description: 'Marketing and promotion expenses',
                                budgetId: budget.id,
                            },
                        })];
                case 17:
                    marketingCategory = _a.sent();
                    return [4 /*yield*/, prisma.category.create({
                            data: {
                                name: 'Operations',
                                allocatedAmount: 40000,
                                description: 'Operational expenses',
                                budgetId: budget.id,
                            },
                        })];
                case 18:
                    operationsCategory = _a.sent();
                    return [4 /*yield*/, prisma.category.create({
                            data: {
                                name: 'Technology',
                                allocatedAmount: 30000,
                                description: 'Technology infrastructure expenses',
                                budgetId: budget.id,
                            },
                        })];
                case 19:
                    technologyCategory = _a.sent();
                    // Create expenses
                    return [4 /*yield*/, prisma.expense.create({
                            data: {
                                title: 'Marketing Campaign',
                                description: 'Digital marketing campaign for the challenge',
                                amount: 15000,
                                date: new Date(),
                                status: 'APPROVED',
                                receipt: 'https://example.com/receipt1.pdf',
                                startupId: startupCall.id,
                                categoryId: marketingCategory.id,
                                milestoneId: startupCall.id,
                                userId: admin.id,
                                budgetId: budget.id,
                            },
                        })];
                case 20:
                    // Create expenses
                    _a.sent();
                    return [4 /*yield*/, prisma.expense.create({
                            data: {
                                title: 'Cloud Infrastructure',
                                description: 'Cloud services for the platform',
                                amount: 10000,
                                date: new Date(),
                                status: 'PENDING',
                                receipt: 'https://example.com/receipt2.pdf',
                                startupId: startupCall.id,
                                categoryId: technologyCategory.id,
                                milestoneId: startupCall.id,
                                userId: admin.id,
                                budgetId: budget.id,
                            },
                        })];
                case 21:
                    _a.sent();
                    console.log('Seed data created successfully');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
