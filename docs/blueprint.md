# **App Name**: Reloxo

## Core Features:

- Personalized Video Feed: A scrollable feed of short videos, curated with an AI tool to suggest content based on user engagement and viewing habits for an optimized 'For You' page experience.
- Video Upload & Basic Editing: Users can record and upload short videos. Future iterations could include basic in-app editing features like adding text overlays or background music. Uses Firebase Storage for video files.
- User Authentication & Profiles: Secure user registration and login using Firebase Authentication. Each user gets a personalized profile page showcasing their uploaded videos and interaction statistics. Basic user settings.
- Video Interaction: Engage with videos through likes, comments, and sharing options, updating engagement metrics stored in Firestore.
- Discover Content: A 'Discover' section to explore trending videos, popular creators, and different categories of content.
- Intuitive Bottom Navigation: A fixed bottom navigation bar featuring Home, Discover, Upload (+), Inbox, and Profile icons for seamless app navigation on mobile devices.

## Style Guidelines:

- The primary interaction color, for elements like buttons, progress bars, and active states, is a vibrant neon cyan (#33F0FF).
- The background color for the application body is pure black (#000000), providing a striking contrast for the neon accents.
- A secondary accent color, a glowing neon green-cyan (#33FFB2), is used for highlights and specific interactive elements, offering visual variety within the neon palette.
- Headlines and prominent text elements use 'Space Grotesk' (sans-serif) for a modern, tech-inspired aesthetic.
- Body text and smaller captions utilize 'Inter' (sans-serif) for excellent readability and a clean, contemporary feel across the application.
- Utilize `lucide-react` icons, applying the neon color palette to ensure they appear with a vibrant glow, consistent with the app's theme.
- A mobile-first responsive layout with a centered, maximum 480px width wrapper on larger screens, simulating a phone interface. A fixed bottom navigation bar is essential for core app functionality.
- Subtle neon glow effects and smooth transitions on interactive elements like buttons and navigation items to enhance the futuristic and dynamic user experience.