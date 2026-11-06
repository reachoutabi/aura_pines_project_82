/**
 * AURA PINES - Centralized Image Asset Configuration
 * High-resolution outdoor, glamping, adventure, and landscape photography.
 * Easily replace or swap URLs with local assets in assets/images/ if desired.
 */

const CAMP_IMAGES = {
  hero: {
    main: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=3840&q=90", // Campfire under Milky Way
    secondary: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=3840&q=90", // Glamping tent in misty forest
    panoramic: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=3840&q=90", // Lake wilderness sunrise
    videoPlaceholder: "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=3840&q=90"
  },
  stays: {
    safariTent: "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=2000&q=90", // Luxury safari canvas tent
    glampingDome: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=2000&q=90", // Geodesic dome starlit
    treehouse: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=90", // Canopy elevated treehouse
    riversidePitch: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=2000&q=90", // Pine riverside pitch
    familyCabin: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=2000&q=90", // Warm cedarwood family cabin
    backpackerPitch: "https://images.unsplash.com/photo-1537905569824-f89f14cceb68?auto=format&fit=crop&w=2000&q=90" // Alpine backpacker tent
  },
  packages: {
    weekendEscape: "https://images.unsplash.com/photo-1525811902-f2342640856e?auto=format&fit=crop&w=2000&q=90", // Cozy canvas safari tent & fireside BBQ
    familyAdventure: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=2000&q=90", // Handcrafted family cabin retreat
    romanticRetreat: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=2000&q=90", // Candlelit dome night
    trekkingExpedition: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=90", // High mountain trek ridge
    corporateTeamOuting: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=2000&q=90", // Outdoor team bonfire gathering
    luxuryGlamping: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=90" // Luxury bespoke deck
  },
  activities: {
    trekking: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2000&q=90",
    campfire: "https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=2000&q=90",
    kayaking: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=90",
    climbing: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=2000&q=90",
    zipline: "https://images.unsplash.com/photo-1539372786391-0518119e77f5?auto=format&fit=crop&w=2000&q=90",
    biking: "https://images.unsplash.com/photo-1660149109561-b98acecd4238?auto=format&fit=crop&w=2000&q=90",
    stargazing: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2000&q=90",
    fishing: "https://images.unsplash.com/photo-1505950476988-702d4a1af500?auto=format&fit=crop&w=2000&q=90",
    birdWatching: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=2000&q=90",
    yoga: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=2000&q=90",
    archery: "https://images.unsplash.com/photo-1601259501461-9a6b562b2728?auto=format&fit=crop&w=2000&q=90",
    bbqDinner: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=90"
  },
  gallery: [
    { title: "Alpine Dawn Over Misty Valley", category: "landscapes", url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=3840&q=90" },
    { title: "Cedar Geodesic Dome at Twilight", category: "stays", url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=3840&q=90" },
    { title: "Campfire Stories Under Aurora", category: "campfire", url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=3840&q=90" },
    { title: "Kayaking Glacial Lake Mirror", category: "adventures", url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=3840&q=90" },
    { title: "Elevated Pine Treehouse Deck", category: "stays", url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=3840&q=90" },
    { title: "Summit Trek Ridge at Sunrise", category: "adventures", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=3840&q=90" },
    { title: "Rustic Artisan Barbecue Gathering", category: "campfire", url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=3840&q=90" },
    { title: "Riverside Canvas Tent at Dusk", category: "stays", url: "https://images.unsplash.com/photo-1496545672447-f699b503d270?auto=format&fit=crop&w=3840&q=90" },
    { title: "Forest Canopy Morning Mist", category: "landscapes", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=3840&q=90" }
  ],
  team: [
    { name: "Julian Thorne", role: "Head Wilderness Ranger & Naturalist", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" },
    { name: "Elena Rostova", role: "Lead Alpine Guide & Expedition Specialist", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
    { name: "Marcus Vance", role: "Camp Executive Chef & Outdoor Forager", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80" },
    { name: "Dr. Maya Lin", role: "Ecologist & Stargazing Astronomy Lead", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" }
  ],
  avatars: {
    guestDemo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
    guest1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    guest2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    guest3: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80"
  }
};

// Export to window if in browser environment
if (typeof window !== "undefined") {
  window.CAMP_IMAGES = CAMP_IMAGES;
}
