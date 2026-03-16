# Relox - Short Video Discovery Platform

Relox is a futuristic, dark-neon themed short-video platform designed for creators to share their "vibes" and monetize their content.

## Features

- **Video Feed**: Infinite scroll with YouTube-integrated player.
- **Creator Studio**: Manage your videos, track views, and edit metadata.
- **Monetization**: Integrated application form and earnings dashboard.
- **In-Stream Ads**: Automated mid-roll and post-roll ad logic for monetization.
- **Social Features**: Follow creators, like videos, and save vibes to your profile.
- **Direct Messaging**: Connect with other users through an encrypted chat system.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & ShadCN UI
- **Backend**: Appwrite (Authentication, Database, Real-time)
- **Media**: Cloudinary (Image Uploads) & YouTube (Video Hosting)
- **AI**: Genkit (Auto-tagging & Personalization)

## How to Push Your Code

To save your work to a remote repository, follow these steps:

1. **Check status**:
   ```bash
   git status
   ```

2. **Stage all changes**:
   ```bash
   git add .
   ```

3. **Commit your work**:
   ```bash
   git commit -m "Complete rebuild and feature polish"
   ```

4. **Add your remote (first time only)**:
   ```bash
   git remote add origin <YOUR_REPOSITORY_URL>
   ```

5. **Push to main branch**:
   ```bash
   git push -u origin main
   ```

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Start Genkit (for AI features)**:
   ```bash
   npm run genkit:dev
   ```

Enjoy building the next vibe! 🚀
