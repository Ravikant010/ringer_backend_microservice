// scripts/seed-ringer.ts

const API_BASE = {
    auth: 'http://localhost:3001/api/v1/auth',
    users: 'http://localhost:3001/api/v1/users',
    posts: 'http://localhost:3002/api/v1/posts',
};

interface User {
    id: string;
    username: string;
    email: string;
    token: string;
}

const users: User[] = [];

// Sample users with firstName and lastName
const SAMPLE_USERS = [
    {
        username: 'sarah_dev',
        email: 'sarah.dev@ringer.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        bio: '💻 Full-stack developer'
    },
    {
        username: 'mike_design',
        email: 'mike.design@ringer.com',
        firstName: 'Mike',
        lastName: 'Chen',
        bio: '🎨 UI/UX Designer'
    },
    {
        username: 'emma_photo',
        email: 'emma.photo@ringer.com',
        firstName: 'Emma',
        lastName: 'Martinez',
        bio: '📸 Travel photographer'
    },
    {
        username: 'alex_fitness',
        email: 'alex.fitness@ringer.com',
        firstName: 'Alex',
        lastName: 'Williams',
        bio: '💪 Fitness coach'
    },
    {
        username: 'lisa_chef',
        email: 'lisa.chef@ringer.com',
        firstName: 'Lisa',
        lastName: 'Anderson',
        bio: '👩‍🍳 Chef'
    },
];

// Post content
const POST_TEMPLATES = [
    {
        content: "Just shipped a major update! 🚀 Can't wait to hear what you think. This has been months in the making!",
        mediaUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    },
    {
        content: "Beautiful sunset at the beach today 🌅 Nature is the best artist. Sometimes you just need to pause and appreciate.",
        mediaUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    },
    {
        content: "Coffee and code ☕💻 The perfect combination! Working on something exciting today. #coding #developer",
        mediaUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    },
    {
        content: "Excited to announce I'll be speaking at TechConf 2025! 🎤 Will be sharing insights on modern web architecture.",
        mediaUrl: null,
    },
    {
        content: "Finished this masterpiece today! 🎨 Spent 20 hours on it but totally worth it. What do you think?",
        mediaUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    },
    {
        content: "Morning workout done! 💪 Remember: consistency beats intensity. Small steps every day lead to big results.",
        mediaUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    },
    {
        content: "Just made the best pasta carbonara ever! 🍝 The secret? Fresh ingredients and lots of love. Recipe coming soon!",
        mediaUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80",
    },
    {
        content: "Team meeting vibes! 🤝 Love working with such talented people. Together we can achieve anything! #teamwork",
        mediaUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    },
    {
        content: "Learning something new every day 📚 Just finished an amazing course. Never stop growing! #learning #development",
        mediaUrl: null,
    },
    {
        content: "Late night coding session 🌙💻 When inspiration hits, you just gotta go with it. Almost done with this feature!",
        mediaUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    },
];

// Helper: Register or login user
async function getOrCreateUser(userData: typeof SAMPLE_USERS[0]): Promise<User> {
    const password = 'Password123!';

    try {
        // Try to register
        const registerRes = await fetch(`${API_BASE.auth}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: userData.username,
                email: userData.email,
                password,
                firstName: userData.firstName,  // ✅ Added
                lastName: userData.lastName,    // ✅ Added
            }),
        });

        const contentType = registerRes.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error(`Auth service returned non-JSON response. Status: ${registerRes.status}`);
        }

        const registerData = await registerRes.json();

        if (!registerRes.ok && !registerData.error?.includes('already exists')) {
            throw new Error(`Registration failed: ${registerData.error || JSON.stringify(registerData)}`);
        }

        if (registerRes.ok) {
            console.log(`   ✅ Registered ${userData.firstName} ${userData.lastName} (@${userData.username})`);
        } else {
            console.log(`   ℹ️  ${userData.username} exists, logging in...`);
        }

        // Login to get token
        const loginRes = await fetch(`${API_BASE.auth}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email, password }),
        });

        const loginContentType = loginRes.headers.get('content-type');
        if (!loginContentType?.includes('application/json')) {
            throw new Error(`Login endpoint returned non-JSON. Status: ${loginRes.status}`);
        }

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginData.error || loginRes.statusText}`);
        }

        return {
            id: loginData.data.user.id,
            username: loginData.data.user.username,
            email: loginData.data.user.email,
            token: loginData.data.accessToken,
        };
    } catch (error: any) {
        console.error(`   ❌ Error with user ${userData.username}:`, error.message);
        throw error;
    }
}

// Helper: Create post
async function createPost(user: User, content: string, mediaUrl: string | null) {
    try {
        const res = await fetch(API_BASE.posts, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                mediaUrl: mediaUrl || undefined,
                visibility: 'public',
            }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error(`Post service returned non-JSON response`);
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Failed to create post');
        }

        console.log(`   📝 @${user.username}: ${content.substring(0, 40)}...`);
        return data.data;
    } catch (error: any) {
        console.error(`   ❌ Error creating post:`, error.message);
        return null;
    }
}

// Helper: Shuffle array
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper: Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main seed function
async function seedRinger() {
    console.log('\n🌟 ═══════════════════════════════════════════════════');
    console.log('   RINGER - Social Media Seed Script');
    console.log('   ═══════════════════════════════════════════════════\n');

    try {
        // Step 1: Create users
        console.log('👥 Creating users...\n');

        for (const userData of SAMPLE_USERS) {
            try {
                const user = await getOrCreateUser(userData);
                users.push(user);
                await delay(300);
            } catch (error) {
                console.log(`   ⚠️  Skipping ${userData.username}\n`);
                continue;
            }
        }

        if (users.length === 0) {
            throw new Error('No users were created successfully!');
        }

        console.log(`\n✅ Created/logged in ${users.length} users\n`);

        // Step 2: Create posts
        console.log('📝 Creating posts...\n');

        const shuffledPosts = shuffle(POST_TEMPLATES);
        let postIndex = 0;

        for (const user of users) {
            const numPosts = Math.floor(Math.random() * 2) + 2; // 2-3 posts per user

            for (let i = 0; i < numPosts; i++) {
                const post = shuffledPosts[postIndex % shuffledPosts.length];
                await createPost(user, post.content, post.mediaUrl);
                postIndex++;
                await delay(200);
            }
        }

        console.log('\n🎉 ═══════════════════════════════════════════════════');
        console.log('   Seeding completed successfully!');
        console.log('   ═══════════════════════════════════════════════════\n');

        console.log('📧 Login with any of these accounts:\n');
        SAMPLE_USERS.forEach(userData => {
            console.log(`   • ${userData.email}`);
            console.log(`     Name: ${userData.firstName} ${userData.lastName}`);
            console.log(`     Username: @${userData.username}`);
            console.log(`     Password: Password123!\n`);
        });

        console.log('🚀 Start your app and check the feed!\n');

    } catch (error: any) {
        console.error('\n❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

// Run the seeding
seedRinger();
